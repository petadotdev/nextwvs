import {
  assertAdminPermission,
  assertCustomerPermission
} from "@petadot/auth";
import {
  requireAdminSession,
  requireCustomerSession
} from "./server";

export async function requireCustomerPermission(domain: string, action: string) {
  const actor = await requireCustomerSession();
  assertCustomerPermission(actor, { domain, action });
  return actor;
}

export async function requireAdminPermission(domain: string, action: string) {
  const actor = await requireAdminSession();
  assertAdminPermission(actor, { domain, action });
  return actor;
}
