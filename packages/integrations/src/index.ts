import { createClient } from "@supabase/supabase-js";
import {
  requirePayPalRuntimeEnv,
  requireRazorpayRuntimeEnv,
  requireStorageRuntimeEnv,
  requireSupabaseServiceRuntimeEnv
} from "@petadot/config";
import type {
  FileMetadataRecord,
  FileOwnerActorType,
  FileVisibility,
  StorageObjectRef
} from "@petadot/types";

export interface FileMetadataDraft {
  tenantId?: string | null;
  ownerActorType?: FileOwnerActorType | null;
  ownerActorId?: string | null;
  category: string;
  originalFilename: string;
  contentType?: string | null;
  byteSize?: number | null;
  checksumSha256?: string | null;
  visibility?: FileVisibility;
  metadata?: Record<string, unknown>;
}

export interface StorageUploadInput {
  object: StorageObjectRef;
  body: BodyInit;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface SignedUrlOptions {
  expiresInSeconds: number;
  download?: boolean | string;
}

export function createSupabaseStorageClient() {
  const env = requireSupabaseServiceRuntimeEnv(process.env);

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function uploadStorageObject(input: StorageUploadInput) {
  requireStorageRuntimeEnv(process.env);
  const client = createSupabaseStorageClient();
  const { error, data } = await client.storage
    .from(input.object.bucket)
    .upload(input.object.path, input.body, {
      contentType: input.contentType,
      cacheControl: input.cacheControl,
      upsert: input.upsert ?? false
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteStorageObject(object: StorageObjectRef) {
  requireStorageRuntimeEnv(process.env);
  const client = createSupabaseStorageClient();
  const { error } = await client.storage
    .from(object.bucket)
    .remove([object.path]);

  if (error) {
    throw error;
  }
}

export async function createStorageSignedUrl(
  object: StorageObjectRef,
  options: SignedUrlOptions
) {
  requireStorageRuntimeEnv(process.env);
  const client = createSupabaseStorageClient();
  const { data, error } = await client.storage
    .from(object.bucket)
    .createSignedUrl(object.path, options.expiresInSeconds, {
      download: options.download ?? false
    });

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export function getPublicStorageUrl(object: StorageObjectRef) {
  requireStorageRuntimeEnv(process.env);
  const client = createSupabaseStorageClient();
  const { data } = client.storage.from(object.bucket).getPublicUrl(object.path);
  return data.publicUrl;
}

export function createFileMetadataRecord(
  object: StorageObjectRef,
  draft: FileMetadataDraft
): Omit<FileMetadataRecord, "id" | "createdAt" | "updatedAt"> {
  return {
    bucket: object.bucket,
    path: object.path,
    tenantId: draft.tenantId ?? null,
    ownerActorType: draft.ownerActorType ?? null,
    ownerActorId: draft.ownerActorId ?? null,
    category: draft.category,
    originalFilename: draft.originalFilename,
    contentType: draft.contentType ?? null,
    byteSize: draft.byteSize ?? null,
    checksumSha256: draft.checksumSha256 ?? null,
    visibility: draft.visibility ?? "private",
    metadata: draft.metadata ?? {},
    deletedAt: null
  };
}

export interface RazorpayOrderInput {
  amountMinor: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
  status: string;
}

export interface PayPalOrderInput {
  amount: number;
  currency: string;
  referenceId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalOrderResult {
  id: string;
  status: string;
  approvalUrl: string | null;
}

export interface PayPalCaptureResult {
  id: string;
  status: string;
  captureId: string;
  amount: number;
  currency: string;
}

async function readJsonResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { description?: string; message?: string };
    message?: string;
    name?: string;
  };

  if (!response.ok) {
    const message =
      payload.error?.description ??
      payload.error?.message ??
      payload.message ??
      payload.name ??
      "Provider request failed";
    throw new Error(message);
  }

  return payload as T;
}

export async function createRazorpayOrder(
  input: RazorpayOrderInput
): Promise<RazorpayOrderResult> {
  const env = requireRazorpayRuntimeEnv(process.env);
  const credentials = Buffer.from(
    `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes ?? {}
    })
  });

  return readJsonResponse<RazorpayOrderResult>(response);
}

async function createPayPalAccessToken() {
  const env = requirePayPalRuntimeEnv(process.env);
  const credentials = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const response = await fetch(`${env.PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const payload = await readJsonResponse<{ access_token: string }>(response);
  return payload.access_token;
}

export async function createPayPalOrder(
  input: PayPalOrderInput
): Promise<PayPalOrderResult> {
  const env = requirePayPalRuntimeEnv(process.env);
  const accessToken = await createPayPalAccessToken();
  const response = await fetch(`${env.PAYPAL_API_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          amount: {
            currency_code: input.currency,
            value: input.amount.toFixed(2)
          }
        }
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl
      }
    })
  });
  const payload = await readJsonResponse<{
    id: string;
    status: string;
    links?: Array<{ href: string; rel: string }>;
  }>(response);

  return {
    id: payload.id,
    status: payload.status,
    approvalUrl:
      payload.links?.find((link) => link.rel === "approve")?.href ?? null
  };
}

export async function capturePayPalOrder(
  orderId: string
): Promise<PayPalCaptureResult> {
  const env = requirePayPalRuntimeEnv(process.env);
  const accessToken = await createPayPalAccessToken();
  const response = await fetch(
    `${env.PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      }
    }
  );
  const payload = await readJsonResponse<{
    id: string;
    status: string;
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{
          id: string;
          status: string;
          amount: {
            value: string;
            currency_code: string;
          };
        }>;
      };
    }>;
  }>(response);
  const capture = payload.purchase_units?.[0]?.payments?.captures?.[0];

  if (!capture) {
    throw new Error("PayPal capture response did not include capture data");
  }

  return {
    id: payload.id,
    status: payload.status,
    captureId: capture.id,
    amount: Number.parseFloat(capture.amount.value),
    currency: capture.amount.currency_code
  };
}
