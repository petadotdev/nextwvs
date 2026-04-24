import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().trim().min(1).optional());

const requiredString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
}, z.string().trim().min(1));

const optionalBoolean = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "") {
    return undefined;
  }

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return value;
}, z.boolean().optional());

const optionalInteger = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return undefined;
  }

  return Number.parseInt(trimmed, 10);
}, z.number().int().optional());

export const publicAppEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: z.string().min(1),
  APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

export const serverAppEnvSchema = publicAppEnvSchema.extend({
  DATABASE_URL: requiredString,
  SUPABASE_SERVICE_ROLE_KEY: requiredString,
  SESSION_SECRET: requiredString,
  SESSION_COOKIE_NAME_USER: z.string().trim().min(1),
  SESSION_COOKIE_NAME_ADMIN: z.string().trim().min(1),
  CUSTOMER_SESSION_TTL_HOURS: optionalInteger,
  ADMIN_SESSION_TTL_HOURS: optionalInteger,
  CUSTOMER_SESSION_MAX_CONCURRENT: optionalInteger,
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  PAYPAL_API_URL: optionalString,
  PAYPAL_CLIENT_ID: optionalString,
  PAYPAL_CLIENT_SECRET: optionalString,
  EMAIL_PROVIDER: optionalString,
  EMAIL_FROM_ADDRESS: optionalString,
  EMAIL_FROM_NAME: optionalString,
  EMAIL_SMTP_HOST: optionalString,
  EMAIL_SMTP_PORT: optionalInteger,
  EMAIL_SMTP_USER: optionalString,
  EMAIL_SMTP_PASSWORD: optionalString,
  EMAIL_SMTP_SECURE: optionalBoolean,
  STORAGE_BUCKET_TICKET_ATTACHMENTS: optionalString,
  STORAGE_BUCKET_SCAN_SCREENSHOTS: optionalString,
  STORAGE_BUCKET_SCAN_EXPORTS: optionalString,
  STORAGE_BUCKET_DMS_EVIDENCE: optionalString,
  STORAGE_BUCKET_WVS_ARTIFACTS: optionalString,
  STORAGE_BUCKET_REPORTS: optionalString,
  SEED_DEFAULT_ADMIN_DEPARTMENT: optionalString,
  SEED_DEFAULT_ADMIN_ROLE: optionalString,
  SEED_DEFAULT_ADMIN_EMAIL: optionalString,
  SEED_DEFAULT_ADMIN_NAME: optionalString,
  SEED_DEFAULT_ADMIN_PASSWORD_HASH: optionalString
});

export type PublicAppEnv = z.infer<typeof publicAppEnvSchema>;
export type ServerAppEnv = z.infer<typeof serverAppEnvSchema>;
export type DatabaseRuntimeEnv = {
  DATABASE_URL: string;
};
export type SupabaseServiceRuntimeEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};
export type StorageRuntimeEnv = SupabaseServiceRuntimeEnv & {
  STORAGE_BUCKET_TICKET_ATTACHMENTS: string;
  STORAGE_BUCKET_SCAN_SCREENSHOTS: string;
  STORAGE_BUCKET_SCAN_EXPORTS: string;
};
export type RazorpayRuntimeEnv = {
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
};
export type RazorpayWebhookRuntimeEnv = {
  RAZORPAY_WEBHOOK_SECRET: string;
};
export type PayPalRuntimeEnv = {
  PAYPAL_API_URL: string;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
};

function pickPublicAppEnv(env: NodeJS.ProcessEnv) {
  return {
    NODE_ENV: env.NODE_ENV ?? "development",
    APP_ENV: env.APP_ENV ?? "",
    APP_URL: env.APP_URL ?? "",
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL ?? "",
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  };
}

function pickServerAppEnv(env: NodeJS.ProcessEnv) {
  return {
    ...pickPublicAppEnv(env),
    DATABASE_URL: env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    SESSION_SECRET: env.SESSION_SECRET,
    SESSION_COOKIE_NAME_USER: env.SESSION_COOKIE_NAME_USER ?? "",
    SESSION_COOKIE_NAME_ADMIN: env.SESSION_COOKIE_NAME_ADMIN ?? "",
    CUSTOMER_SESSION_TTL_HOURS: env.CUSTOMER_SESSION_TTL_HOURS,
    ADMIN_SESSION_TTL_HOURS: env.ADMIN_SESSION_TTL_HOURS,
    CUSTOMER_SESSION_MAX_CONCURRENT: env.CUSTOMER_SESSION_MAX_CONCURRENT,
    RAZORPAY_KEY_ID: env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: env.RAZORPAY_WEBHOOK_SECRET,
    PAYPAL_API_URL: env.PAYPAL_API_URL,
    PAYPAL_CLIENT_ID: env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: env.PAYPAL_CLIENT_SECRET,
    EMAIL_PROVIDER: env.EMAIL_PROVIDER,
    EMAIL_FROM_ADDRESS: env.EMAIL_FROM_ADDRESS,
    EMAIL_FROM_NAME: env.EMAIL_FROM_NAME,
    EMAIL_SMTP_HOST: env.EMAIL_SMTP_HOST,
    EMAIL_SMTP_PORT: env.EMAIL_SMTP_PORT,
    EMAIL_SMTP_USER: env.EMAIL_SMTP_USER,
    EMAIL_SMTP_PASSWORD: env.EMAIL_SMTP_PASSWORD,
    EMAIL_SMTP_SECURE: env.EMAIL_SMTP_SECURE,
    STORAGE_BUCKET_TICKET_ATTACHMENTS: env.STORAGE_BUCKET_TICKET_ATTACHMENTS,
    STORAGE_BUCKET_SCAN_SCREENSHOTS: env.STORAGE_BUCKET_SCAN_SCREENSHOTS,
    STORAGE_BUCKET_SCAN_EXPORTS: env.STORAGE_BUCKET_SCAN_EXPORTS,
    STORAGE_BUCKET_DMS_EVIDENCE: env.STORAGE_BUCKET_DMS_EVIDENCE,
    STORAGE_BUCKET_WVS_ARTIFACTS: env.STORAGE_BUCKET_WVS_ARTIFACTS,
    STORAGE_BUCKET_REPORTS: env.STORAGE_BUCKET_REPORTS,
    SEED_DEFAULT_ADMIN_DEPARTMENT: env.SEED_DEFAULT_ADMIN_DEPARTMENT,
    SEED_DEFAULT_ADMIN_ROLE: env.SEED_DEFAULT_ADMIN_ROLE,
    SEED_DEFAULT_ADMIN_EMAIL: env.SEED_DEFAULT_ADMIN_EMAIL,
    SEED_DEFAULT_ADMIN_NAME: env.SEED_DEFAULT_ADMIN_NAME,
    SEED_DEFAULT_ADMIN_PASSWORD_HASH: env.SEED_DEFAULT_ADMIN_PASSWORD_HASH
  };
}

export function parsePublicAppEnv(env: NodeJS.ProcessEnv) {
  return publicAppEnvSchema.parse(pickPublicAppEnv(env));
}

export function parseServerAppEnv(env: NodeJS.ProcessEnv) {
  return serverAppEnvSchema.parse(pickServerAppEnv(env));
}

export function parsePublicSupabaseEnv(env: NodeJS.ProcessEnv) {
  const appEnv = parsePublicAppEnv(env);

  return {
    NEXT_PUBLIC_SUPABASE_URL: appEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: appEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}

export function parseServerSupabaseEnv(env: NodeJS.ProcessEnv) {
  const appEnv = parseServerAppEnv(env);

  return {
    NEXT_PUBLIC_SUPABASE_URL: appEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: appEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: appEnv.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function requireDatabaseRuntimeEnv(
  env: NodeJS.ProcessEnv
): DatabaseRuntimeEnv {
  const appEnv = parseServerAppEnv(env);

  return {
    DATABASE_URL: appEnv.DATABASE_URL
  };
}

export function requireSupabaseServiceRuntimeEnv(
  env: NodeJS.ProcessEnv
): SupabaseServiceRuntimeEnv {
  const appEnv = parseServerAppEnv(env);

  return {
    NEXT_PUBLIC_SUPABASE_URL: appEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: appEnv.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function requireStorageRuntimeEnv(
  env: NodeJS.ProcessEnv
): StorageRuntimeEnv {
  const appEnv = parseServerAppEnv(env);

  if (!appEnv.STORAGE_BUCKET_TICKET_ATTACHMENTS) {
    throw new Error(
      "STORAGE_BUCKET_TICKET_ATTACHMENTS is required for storage runtime operations"
    );
  }

  if (!appEnv.STORAGE_BUCKET_SCAN_SCREENSHOTS) {
    throw new Error(
      "STORAGE_BUCKET_SCAN_SCREENSHOTS is required for storage runtime operations"
    );
  }

  if (!appEnv.STORAGE_BUCKET_SCAN_EXPORTS) {
    throw new Error(
      "STORAGE_BUCKET_SCAN_EXPORTS is required for storage runtime operations"
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: appEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: appEnv.SUPABASE_SERVICE_ROLE_KEY,
    STORAGE_BUCKET_TICKET_ATTACHMENTS: appEnv.STORAGE_BUCKET_TICKET_ATTACHMENTS,
    STORAGE_BUCKET_SCAN_SCREENSHOTS: appEnv.STORAGE_BUCKET_SCAN_SCREENSHOTS,
    STORAGE_BUCKET_SCAN_EXPORTS: appEnv.STORAGE_BUCKET_SCAN_EXPORTS
  };
}

export function requireRazorpayRuntimeEnv(
  env: NodeJS.ProcessEnv
): RazorpayRuntimeEnv {
  const appEnv = parseServerAppEnv(env);

  if (!appEnv.RAZORPAY_KEY_ID || !appEnv.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for Razorpay orders"
    );
  }

  return {
    RAZORPAY_KEY_ID: appEnv.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: appEnv.RAZORPAY_KEY_SECRET
  };
}

export function requireRazorpayWebhookRuntimeEnv(
  env: NodeJS.ProcessEnv
): RazorpayWebhookRuntimeEnv {
  const appEnv = parseServerAppEnv(env);

  if (!appEnv.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error(
      "RAZORPAY_WEBHOOK_SECRET is required for Razorpay webhooks"
    );
  }

  return {
    RAZORPAY_WEBHOOK_SECRET: appEnv.RAZORPAY_WEBHOOK_SECRET
  };
}

export function requirePayPalRuntimeEnv(
  env: NodeJS.ProcessEnv
): PayPalRuntimeEnv {
  const appEnv = parseServerAppEnv(env);

  if (
    !appEnv.PAYPAL_API_URL ||
    !appEnv.PAYPAL_CLIENT_ID ||
    !appEnv.PAYPAL_CLIENT_SECRET
  ) {
    throw new Error(
      "PAYPAL_API_URL, PAYPAL_CLIENT_ID, and PAYPAL_CLIENT_SECRET are required"
    );
  }

  return {
    PAYPAL_API_URL: appEnv.PAYPAL_API_URL,
    PAYPAL_CLIENT_ID: appEnv.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: appEnv.PAYPAL_CLIENT_SECRET
  };
}
