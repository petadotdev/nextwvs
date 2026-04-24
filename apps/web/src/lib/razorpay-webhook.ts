import { createHmac } from "node:crypto";
import { requireRazorpayWebhookRuntimeEnv } from "@petadot/config";
import {
  BillingRepository,
  withTransaction,
  type JsonValue
} from "@petadot/db";
import { ApiError, errorResponse, successResponse } from "./auth/api";

type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string;
  status?: string;
  captured?: boolean;
  amount?: number;
  currency?: string;
  method?: string;
  bank?: string;
  captured_at?: number;
};

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
};

function asObject(value: unknown): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, JsonValue>;
}

function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const env = requireRazorpayWebhookRuntimeEnv(process.env);
  const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return expected === signature;
}

function createInvoiceNumber(purchaseId: string) {
  return `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${purchaseId
    .slice(0, 8)
    .toUpperCase()}`;
}

export async function handleRazorpayWebhook(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const providerEventId =
    request.headers.get("x-razorpay-event-id") ??
    request.headers.get("x-razorpay-delivery-id") ??
    "";
  const signatureValid = verifyWebhookSignature(rawBody, signature);

  if (!signatureValid) {
    throw new ApiError(
      401,
      "INVALID_WEBHOOK_SIGNATURE",
      "Webhook signature is invalid"
    );
  }

  const payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  const payment = payload.payload?.payment?.entity;
  const eventType = payload.event ?? "unknown";
  const eventId = providerEventId || payment?.id || `razorpay-${Date.now()}`;
  const repository = new BillingRepository();
  const purchase = payment?.order_id
    ? await repository.findPurchaseByRazorpayOrderIdAnyTenant(payment.order_id)
    : null;
  const event = await repository.createPaymentEvent({
    provider: "razorpay",
    providerEventId: eventId,
    purchaseId: purchase?.id ?? null,
    tenantId: purchase?.tenantId ?? null,
    eventType,
    signatureValid,
    payload: asObject(payload)
  });

  if (!event.inserted) {
    return {
      accepted: true,
      duplicate: true,
      eventId
    };
  }

  if (eventType !== "payment.captured") {
    await repository.markPaymentEventProcessed(
      "razorpay",
      eventId,
      "ignored_event_type",
      purchase?.id,
      purchase?.tenantId
    );

    return {
      accepted: true,
      ignored: true,
      eventId,
      eventType
    };
  }

  if (!payment?.order_id || !payment.id) {
    await repository.markPaymentEventProcessed(
      "razorpay",
      eventId,
      "missing_payment_identity"
    );
    throw new ApiError(
      422,
      "INVALID_WEBHOOK_PAYLOAD",
      "Payment identity is missing"
    );
  }
  const paymentId = payment.id;

  if (payment.status !== "captured" || payment.captured !== true) {
    await repository.markPaymentEventProcessed(
      "razorpay",
      eventId,
      "payment_not_captured",
      purchase?.id,
      purchase?.tenantId
    );

    return {
      accepted: true,
      ignored: true,
      eventId,
      reason: "payment_not_captured"
    };
  }

  if (!purchase) {
    await repository.markPaymentEventProcessed(
      "razorpay",
      eventId,
      "purchase_not_found"
    );
    throw new ApiError(404, "PURCHASE_NOT_FOUND", "Purchase not found");
  }

  const result = await withTransaction(async (tx) => {
    const txRepository = new BillingRepository({ db: tx });

    return txRepository.finalizePaidPurchase({
      purchaseId: purchase.id,
      invoiceNumber: purchase.invoiceNumber ?? createInvoiceNumber(purchase.id),
      paymentId,
      paymentAmount: Number(payment.amount ?? 0) / 100,
      currency: payment.currency ?? purchase.currency ?? purchase.priceCurrency,
      signature,
      bankReferenceNumber: payment.bank ?? payment.method ?? null
    });
  });

  await repository.markPaymentEventProcessed(
    "razorpay",
    eventId,
    result?.finalized ? "finalized" : "already_paid",
    purchase.id,
    purchase.tenantId
  );

  return {
    accepted: true,
    duplicate: false,
    finalized: result?.finalized ?? false,
    eventId,
    purchaseId: purchase.id
  };
}

export { errorResponse, successResponse };
