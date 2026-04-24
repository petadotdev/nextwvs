import {
  createHmac,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";

export type ActorType = "customer_user" | "admin_employee";
export type SessionActorType = ActorType;

export interface SessionCookieNames {
  customer: string;
  admin: string;
}

export interface SessionCookieOptions {
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  path: string;
  expires: Date;
}

export interface SessionTokenPair {
  rawToken: string;
  tokenHash: string;
}

export interface CustomerSessionPrincipal {
  actorType: "customer_user";
  sessionId: string;
  userId: string;
  tenantId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  status: string;
  teamManageAccess: boolean;
  membershipRoleId: string | null;
  permissions: PermissionGrant[];
  expiresAt: string;
}

export interface AdminSessionPrincipal {
  actorType: "admin_employee";
  sessionId: string;
  employeeId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  status: string;
  roleId: string | null;
  departmentId: string | null;
  permissions: PermissionGrant[];
  expiresAt: string;
}

export type SessionPrincipal =
  | CustomerSessionPrincipal
  | AdminSessionPrincipal;

export interface PermissionGrant {
  domain: string;
  action: string;
  allowed: boolean;
}

const scrypt = promisify(nodeScrypt);

export interface SessionValidationResult<TPrincipal extends SessionPrincipal> {
  principal: TPrincipal | null;
  shouldClearCookie: boolean;
}

export const DEFAULT_CUSTOMER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const DEFAULT_ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12;
export const DEFAULT_MAX_CONCURRENT_CUSTOMER_SESSIONS = 5;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createSessionTokenPair(secret: string): SessionTokenPair {
  const rawToken = randomBytes(32).toString("base64url");

  return {
    rawToken,
    tokenHash: hashSessionToken(rawToken, secret)
  };
}

export function hashSessionToken(rawToken: string, secret: string) {
  return createHmac("sha256", secret).update(rawToken).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, salt, expectedHash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return constantTimeEqual(derivedKey.toString("hex"), expectedHash);
}

export function createOneTimeCode(length = 6) {
  const max = 10 ** length;
  const code = randomBytes(4).readUInt32BE(0) % max;
  return code.toString().padStart(length, "0");
}

export function hashOneTimeCode(code: string, secret: string) {
  return createHmac("sha256", secret).update(code).digest("hex");
}

function decodeBase32(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = secret.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = "";

  for (const character of normalized) {
    const index = alphabet.indexOf(character);

    if (index === -1) {
      throw new Error("Invalid base32 secret");
    }

    bits += index.toString(2).padStart(5, "0");
  }

  const bytes = bits.match(/.{1,8}/g) ?? [];
  return Buffer.from(
    bytes
      .filter((chunk) => chunk.length === 8)
      .map((chunk) => Number.parseInt(chunk, 2))
  );
}

export function verifyTotpCode(secret: string, code: string, now = Date.now()) {
  const normalizedCode = code.trim();

  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const secretBytes = decodeBase32(secret);
  const counter = Math.floor(now / 30_000);

  for (let offset = -1; offset <= 1; offset += 1) {
    const currentCounter = counter + offset;
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(currentCounter / 0x1_0000_0000), 0);
    counterBuffer.writeUInt32BE(currentCounter >>> 0, 4);

    const hmac = createHmac("sha1", secretBytes).update(counterBuffer).digest();
    const dynamicOffset = hmac[hmac.length - 1] & 0x0f;
    const truncated =
      ((hmac[dynamicOffset] & 0x7f) << 24) |
      ((hmac[dynamicOffset + 1] & 0xff) << 16) |
      ((hmac[dynamicOffset + 2] & 0xff) << 8) |
      (hmac[dynamicOffset + 3] & 0xff);
    const generatedCode = (truncated % 1_000_000).toString().padStart(6, "0");

    if (generatedCode === normalizedCode) {
      return true;
    }
  }

  return false;
}

export function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionCookieOptions(
  expiresAt: Date,
  isProduction: boolean
): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    expires: expiresAt
  };
}

export function getSessionCookieName(
  actorType: SessionActorType,
  cookieNames: SessionCookieNames
) {
  return actorType === "customer_user" ? cookieNames.customer : cookieNames.admin;
}

export function isSessionExpired(expiresAt: string | Date, now = new Date()) {
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function resolvePermission(
  permissions: PermissionGrant[],
  domain: string,
  action: string
) {
  const normalizedDomain = domain.trim().toLowerCase();
  const normalizedAction = action.trim().toLowerCase();

  return permissions.find(
    (permission) =>
      permission.domain.trim().toLowerCase() === normalizedDomain &&
      permission.action.trim().toLowerCase() === normalizedAction
  );
}

export function hasPermission(
  permissions: PermissionGrant[],
  domain: string,
  action: string
) {
  return resolvePermission(permissions, domain, action)?.allowed ?? false;
}

export function assertPermission(
  permissions: PermissionGrant[],
  domain: string,
  action: string
) {
  if (!hasPermission(permissions, domain, action)) {
    throw new Error(`Missing required permission: ${domain}:${action}`);
  }
}

export function assertCustomerPermission(
  actor: Pick<CustomerSessionPrincipal, "permissions">,
  permission: { domain: string; action: string }
) {
  assertPermission(actor.permissions, permission.domain, permission.action);
}

export function assertAdminPermission(
  actor: Pick<AdminSessionPrincipal, "permissions">,
  permission: { domain: string; action: string }
) {
  assertPermission(actor.permissions, permission.domain, permission.action);
}
