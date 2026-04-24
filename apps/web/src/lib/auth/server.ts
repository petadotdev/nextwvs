import { cookies, headers } from "next/headers";
import {
  createSessionCookieOptions,
  createSessionTokenPair,
  type CustomerSessionPrincipal,
  type SessionPrincipal,
  getSessionCookieName,
  hashSessionToken,
  type AdminSessionPrincipal
} from "@petadot/auth";
import {
  AdminEmployeeRepository,
  AdminSessionRepository,
  CustomerMembershipRepository,
  CustomerSessionRepository,
  UserRepository,
  withTransaction
} from "@petadot/db";
import { getAuthRuntimeEnv } from "./env";

function getSessionCookieNames() {
  const env = getAuthRuntimeEnv();

  return {
    customer: env.customerSessionCookieName,
    admin: env.adminSessionCookieName
  };
}

async function getRequestMetadata() {
  const headerStore = await headers();

  return {
    userAgent: headerStore.get("user-agent"),
    ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
  };
}

export async function createCustomerAppSession(input: {
  userId: string;
  tenantId: string;
}) {
  const env = getAuthRuntimeEnv();
  const cookieStore = await cookies();
  const requestMetadata = await getRequestMetadata();
  const { rawToken, tokenHash } = createSessionTokenPair(env.sessionSecret);
  const expiresAt = new Date(Date.now() + env.customerSessionTtlHours * 60 * 60 * 1000);

  const session = await withTransaction(async (tx) => {
    const sessions = new CustomerSessionRepository({ db: tx });
    const users = new UserRepository({ db: tx });

    const createdSession = await sessions.create({
      userId: input.userId,
      tenantId: input.tenantId,
      sessionTokenHash: tokenHash,
      userAgent: requestMetadata.userAgent,
      ipAddress: requestMetadata.ipAddress,
      expiresAt
    });

    await sessions.revokeAllForUserExcept(
      input.userId,
      createdSession.id,
      env.customerSessionMaxConcurrent
    );
    await users.markCustomerLogin(input.userId, requestMetadata.ipAddress);

    return createdSession;
  });

  cookieStore.set(
    getSessionCookieName("customer_user", getSessionCookieNames()),
    rawToken,
    createSessionCookieOptions(expiresAt, env.nodeEnv === "production")
  );

  return session;
}

export async function createAdminAppSession(input: { employeeId: string }) {
  const env = getAuthRuntimeEnv();
  const cookieStore = await cookies();
  const requestMetadata = await getRequestMetadata();
  const { rawToken, tokenHash } = createSessionTokenPair(env.sessionSecret);
  const expiresAt = new Date(Date.now() + env.adminSessionTtlHours * 60 * 60 * 1000);

  const session = await withTransaction(async (tx) => {
    const sessions = new AdminSessionRepository({ db: tx });
    const employees = new AdminEmployeeRepository({ db: tx });

    const createdSession = await sessions.create({
      employeeId: input.employeeId,
      sessionTokenHash: tokenHash,
      userAgent: requestMetadata.userAgent,
      ipAddress: requestMetadata.ipAddress,
      expiresAt
    });

    await employees.markAdminLogin(input.employeeId, requestMetadata.ipAddress);

    return createdSession;
  });

  cookieStore.set(
    getSessionCookieName("admin_employee", getSessionCookieNames()),
    rawToken,
    createSessionCookieOptions(expiresAt, env.nodeEnv === "production")
  );

  return session;
}

export async function getCustomerSessionPrincipal() {
  const env = getAuthRuntimeEnv();
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(env.customerSessionCookieName)?.value;

  if (!rawToken) {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken, env.sessionSecret);
  const sessions = new CustomerSessionRepository();
  const users = new UserRepository();
  const memberships = new CustomerMembershipRepository();
  const session = await sessions.findActiveByTokenHash(tokenHash);

  if (!session) {
    cookieStore.delete(env.customerSessionCookieName);
    return null;
  }

  const [user, membership, permissions] = await Promise.all([
    users.findById(session.userId),
    memberships.findActiveMembershipByUserId(session.userId),
    memberships.listPermissionsForUser(session.userId)
  ]);

  if (!user || user.status !== "active") {
    await sessions.revokeById(session.id);
    cookieStore.delete(env.customerSessionCookieName);
    return null;
  }

  await sessions.touch(session.id);

  return {
    actorType: "customer_user",
    sessionId: session.id,
    userId: user.id,
    tenantId: session.tenantId,
    email: user.email,
    emailVerified: user.isEmailVerified,
    name: user.name,
    status: user.status,
    teamManageAccess: user.teamManageAccess,
    membershipRoleId: membership?.roleId ?? null,
    permissions,
    expiresAt: session.expiresAt
  } satisfies CustomerSessionPrincipal;
}

export async function getAdminSessionPrincipal() {
  const env = getAuthRuntimeEnv();
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(env.adminSessionCookieName)?.value;

  if (!rawToken) {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken, env.sessionSecret);
  const sessions = new AdminSessionRepository();
  const employees = new AdminEmployeeRepository();
  const session = await sessions.findActiveByTokenHash(tokenHash);

  if (!session) {
    cookieStore.delete(env.adminSessionCookieName);
    return null;
  }

  const [employee, permissions] = await Promise.all([
    employees.findById(session.employeeId),
    employees.listPermissionsForEmployee(session.employeeId)
  ]);

  if (!employee || employee.status !== "active") {
    await sessions.revokeById(session.id);
    cookieStore.delete(env.adminSessionCookieName);
    return null;
  }

  await sessions.touch(session.id);

  return {
    actorType: "admin_employee",
    sessionId: session.id,
    employeeId: employee.id,
    email: employee.email,
    emailVerified: employee.isEmailVerified,
    name: employee.name,
    status: employee.status,
    roleId: employee.roleId,
    departmentId: employee.departmentId,
    permissions,
    expiresAt: session.expiresAt
  } satisfies AdminSessionPrincipal;
}

export async function getCurrentSessionPrincipal(): Promise<SessionPrincipal | null> {
  const [customerPrincipal, adminPrincipal] = await Promise.all([
    getCustomerSessionPrincipal(),
    getAdminSessionPrincipal()
  ]);

  return customerPrincipal ?? adminPrincipal;
}

export async function requireCustomerSession() {
  const principal = await getCustomerSessionPrincipal();

  if (!principal) {
    throw new Error("Customer session is required");
  }

  return principal;
}

export async function requireAdminSession() {
  const principal = await getAdminSessionPrincipal();

  if (!principal) {
    throw new Error("Admin session is required");
  }

  return principal;
}

export async function signOutCustomerSession() {
  const env = getAuthRuntimeEnv();
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(env.customerSessionCookieName)?.value;

  if (rawToken) {
    const sessions = new CustomerSessionRepository();
    const session = await sessions.findActiveByTokenHash(
      hashSessionToken(rawToken, env.sessionSecret)
    );

    if (session) {
      await sessions.revokeById(session.id);
    }
  }

  cookieStore.delete(env.customerSessionCookieName);
}

export async function signOutAdminSession() {
  const env = getAuthRuntimeEnv();
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(env.adminSessionCookieName)?.value;

  if (rawToken) {
    const sessions = new AdminSessionRepository();
    const session = await sessions.findActiveByTokenHash(
      hashSessionToken(rawToken, env.sessionSecret)
    );

    if (session) {
      await sessions.revokeById(session.id);
    }
  }

  cookieStore.delete(env.adminSessionCookieName);
}
