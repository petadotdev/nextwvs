import { parseServerAppEnv } from "@petadot/config";

export interface AuthRuntimeEnv {
  nodeEnv: "development" | "test" | "production";
  sessionSecret: string;
  customerSessionCookieName: string;
  adminSessionCookieName: string;
  customerSessionTtlHours: number;
  adminSessionTtlHours: number;
  customerSessionMaxConcurrent: number;
}

export function getAuthRuntimeEnv(): AuthRuntimeEnv {
  const env = parseServerAppEnv(process.env);

  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required for auth runtime operations");
  }

  return {
    nodeEnv: env.NODE_ENV,
    sessionSecret: env.SESSION_SECRET,
    customerSessionCookieName: env.SESSION_COOKIE_NAME_USER,
    adminSessionCookieName: env.SESSION_COOKIE_NAME_ADMIN,
    customerSessionTtlHours: env.CUSTOMER_SESSION_TTL_HOURS ?? 24 * 30,
    adminSessionTtlHours: env.ADMIN_SESSION_TTL_HOURS ?? 12,
    customerSessionMaxConcurrent: env.CUSTOMER_SESSION_MAX_CONCURRENT ?? 5
  };
}
