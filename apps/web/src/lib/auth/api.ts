import { randomUUID } from "node:crypto";
import {
  createOneTimeCode,
  hashOneTimeCode,
  hashPassword,
  normalizeEmail,
  verifyPassword,
  verifyTotpCode
} from "@petadot/auth";
import {
  AdminEmployeeRepository,
  CustomerMembershipRepository,
  OtpChallengeRepository,
  UserRepository,
  VerificationTokenRepository,
  withTransaction
} from "@petadot/db";
import type {
  AdminSignInInput,
  CustomerSignInInput,
  CustomerSignUpInput
} from "@petadot/validation";
import { createSupabaseAdminClient } from "../supabase/admin";
import { getAuthRuntimeEnv } from "./env";
import {
  createAdminAppSession,
  createCustomerAppSession,
  getCurrentSessionPrincipal
} from "./server";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function successResponse(data: Record<string, unknown>, status = 200) {
  return Response.json(
    {
      ok: true,
      data,
      meta: {}
    },
    { status }
  );
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? {}
        }
      },
      { status: error.status }
    );
  }

  return Response.json(
    {
      ok: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error",
        details: {}
      }
    },
    { status: 500 }
  );
}

async function maybeCreateSupabaseCustomerIdentity(input: {
  email: string;
  password: string;
  name: string;
}) {
  try {
    const client = createSupabaseAdminClient();
    const result = await client.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: false,
      user_metadata: { name: input.name }
    });

    if (result.error) {
      throw new ApiError(500, "SUPABASE_AUTH_CREATE_FAILED", result.error.message);
    }

    return result.data.user?.id ?? null;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    return null;
  }
}

async function maybeUpdateSupabasePassword(
  supabaseAuthUserId: string | null,
  password: string
) {
  if (!supabaseAuthUserId) {
    return;
  }

  try {
    const client = createSupabaseAdminClient();
    const result = await client.auth.admin.updateUserById(supabaseAuthUserId, {
      password
    });

    if (result.error) {
      throw new ApiError(500, "SUPABASE_AUTH_UPDATE_FAILED", result.error.message);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
  }
}

export async function signUpCustomer(input: CustomerSignUpInput) {
  const users = new UserRepository();
  const existingUser = await users.findByEmailNormalized(normalizeEmail(input.email));

  if (existingUser) {
    throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "An account with that email already exists");
  }

  const userId = randomUUID();
  const passwordHash = await hashPassword(input.password);
  const verificationToken = randomUUID() + randomUUID();
  const env = getAuthRuntimeEnv();
  const tokenHash = hashOneTimeCode(verificationToken, env.sessionSecret);
  const supabaseAuthUserId = await maybeCreateSupabaseCustomerIdentity({
    email: input.email,
    password: input.password,
    name: input.name
  });

  await withTransaction(async (tx) => {
    const txUsers = new UserRepository({ db: tx });
    const txVerificationTokens = new VerificationTokenRepository({ db: tx });

    await txUsers.createPrimaryUser({
      id: userId,
      supabaseAuthUserId,
      name: input.name,
      email: input.email,
      passwordHash,
      contactNumber: input.contactNumber ?? null,
      countryCode: input.countryCode ?? null,
      signupMeta: {
        referralCode: input.referralCode ?? null,
        utmOffer: input.utmOffer ?? null,
        targetUrl: input.targetUrl ?? null
      }
    });

    await txVerificationTokens.create({
      actorType: "customer_user",
      actorId: userId,
      tenantId: userId,
      purpose: "email_verification",
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    });
  });

  return {
    userId,
    requiresEmailVerification: true,
    redirectTo: "/auth/verify-email",
    verificationToken
  };
}

export async function verifyCustomerEmail(token: string) {
  const env = getAuthRuntimeEnv();
  const tokenHash = hashOneTimeCode(token, env.sessionSecret);
  const verificationTokens = new VerificationTokenRepository();
  const verificationToken = await verificationTokens.findActiveByPurposeAndTokenHash(
    "email_verification",
    tokenHash
  );

  if (!verificationToken || verificationToken.actorType !== "customer_user") {
    throw new ApiError(422, "INVALID_TOKEN", "Email verification token is invalid or expired");
  }

  await withTransaction(async (tx) => {
    const txUsers = new UserRepository({ db: tx });
    const txVerificationTokens = new VerificationTokenRepository({ db: tx });

    await txUsers.verifyEmail(verificationToken.actorId);
    await txVerificationTokens.markUsed(verificationToken.id);
  });

  return {
    verified: true,
    redirectTo: "/auth/signin"
  };
}

export async function signInCustomer(input: CustomerSignInInput) {
  const users = new UserRepository();
  const otpChallenges = new OtpChallengeRepository();
  const user = await users.findByEmailNormalized(normalizeEmail(input.email));

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "ACCOUNT_INACTIVE", "Account is inactive");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Email verification is required");
  }

  if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
    throw new ApiError(403, "ACCOUNT_LOCKED", "Account is temporarily locked");
  }

  if (user.twoFactorEnabled && user.twoFactorSecretEncrypted) {
    const challenge = await otpChallenges.create({
      actorType: "customer_user",
      actorId: user.id,
      tenantId: user.tenantId,
      provider: "totp",
      channel: "authenticator",
      destinationMasked: null,
      providerRequestId: null,
      codeHash: null,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5)
    });

    return {
      requires2fa: true,
      challengeId: challenge.id,
      redirectTo: "/auth/2fa-login"
    };
  }

  await createCustomerAppSession({
    userId: user.id,
    tenantId: user.tenantId
  });

  return {
    requires2fa: false,
    redirectTo: "/user/wvs/dashboard"
  };
}

export async function verifyCustomerTwoFactor(challengeId: string, code: string) {
  const otpChallenges = new OtpChallengeRepository();
  const users = new UserRepository();
  const challenge = await otpChallenges.findById(challengeId);

  if (!challenge || challenge.actorType !== "customer_user") {
    throw new ApiError(404, "CHALLENGE_NOT_FOUND", "2FA challenge not found");
  }

  if (challenge.verifiedAt || new Date(challenge.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(422, "CHALLENGE_EXPIRED", "2FA challenge is expired");
  }

  if (challenge.attemptCount >= challenge.maxAttempts) {
    throw new ApiError(429, "CHALLENGE_ATTEMPTS_EXCEEDED", "Too many invalid attempts");
  }

  const user = await users.findById(challenge.actorId);

  if (!user?.twoFactorSecretEncrypted) {
    throw new ApiError(422, "TWO_FACTOR_NOT_CONFIGURED", "2FA is not configured");
  }

  if (!verifyTotpCode(user.twoFactorSecretEncrypted, code)) {
    await otpChallenges.incrementAttempt(challenge.id);
    throw new ApiError(422, "INVALID_TWO_FACTOR_CODE", "Invalid authentication code");
  }

  await otpChallenges.markVerified(challenge.id);
  await createCustomerAppSession({
    userId: user.id,
    tenantId: user.tenantId
  });

  return {
    requires2fa: false,
    redirectTo: "/user/wvs/dashboard"
  };
}

export async function sendCustomerPasswordReset(email: string) {
  const users = new UserRepository();
  const user = await users.findByEmailNormalized(normalizeEmail(email));

  if (!user) {
    return { emailSent: true };
  }

  const env = getAuthRuntimeEnv();
  const rawToken = randomUUID() + randomUUID();
  const tokenHash = hashOneTimeCode(rawToken, env.sessionSecret);
  const verificationTokens = new VerificationTokenRepository();

  await verificationTokens.markUsedByActorAndPurpose(
    "customer_user",
    user.id,
    "password_reset"
  );
  await verificationTokens.create({
    actorType: "customer_user",
    actorId: user.id,
    tenantId: user.tenantId,
    purpose: "password_reset",
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 30)
  });

  return {
    emailSent: true,
    resetToken: rawToken
  };
}

export async function resetCustomerPassword(token: string, password: string) {
  const env = getAuthRuntimeEnv();
  const verificationTokens = new VerificationTokenRepository();
  const tokenHash = hashOneTimeCode(token, env.sessionSecret);
  const resetToken = await verificationTokens.findActiveByPurposeAndTokenHash(
    "password_reset",
    tokenHash
  );

  if (!resetToken || resetToken.actorType !== "customer_user") {
    throw new ApiError(422, "INVALID_TOKEN", "Password reset token is invalid or expired");
  }

  const users = new UserRepository();
  const user = await users.findById(resetToken.actorId);

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  const passwordHash = await hashPassword(password);

  await withTransaction(async (tx) => {
    const txUsers = new UserRepository({ db: tx });
    const txTokens = new VerificationTokenRepository({ db: tx });

    await txUsers.updatePassword(user.id, passwordHash);
    await txTokens.markUsed(resetToken.id);
  });
  await maybeUpdateSupabasePassword(user.supabaseAuthUserId, password);

  return { passwordReset: true };
}

export async function sendPhoneOtp(
  userId: string,
  contactNumber: string,
  countryCode: string
) {
  const users = new UserRepository();
  const user = await users.findById(userId);

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  const env = getAuthRuntimeEnv();
  const code = createOneTimeCode(6);
  const challenge = await new OtpChallengeRepository().create({
    actorType: "customer_user",
    actorId: user.id,
    tenantId: user.tenantId,
    provider: "internal",
    channel: "sms",
    destinationMasked: `${countryCode}${contactNumber.slice(-4).padStart(contactNumber.length, "*")}`,
    providerRequestId: null,
    codeHash: hashOneTimeCode(code, env.sessionSecret),
    maxAttempts: 5,
    expiresAt: new Date(Date.now() + 1000 * 60 * 10)
  });

  return {
    sent: true,
    challengeId: challenge.id,
    code
  };
}

export async function verifyPhoneOtp(
  challengeId: string,
  userId: string,
  code: string
) {
  const env = getAuthRuntimeEnv();
  const otpChallenges = new OtpChallengeRepository();
  const users = new UserRepository();
  const challenge = await otpChallenges.findById(challengeId);

  if (!challenge || challenge.actorType !== "customer_user" || challenge.actorId !== userId) {
    throw new ApiError(404, "OTP_CHALLENGE_NOT_FOUND", "Phone verification challenge not found");
  }

  if (challenge.verifiedAt || new Date(challenge.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(422, "OTP_EXPIRED", "OTP challenge is expired");
  }

  if (challenge.codeHash !== hashOneTimeCode(code, env.sessionSecret)) {
    await otpChallenges.incrementAttempt(challenge.id);
    throw new ApiError(422, "INVALID_OTP_CODE", "Invalid verification code");
  }

  await otpChallenges.markVerified(challenge.id);
  await users.verifyPhone(userId);

  return { verified: true };
}

export async function signInAdmin(input: AdminSignInInput) {
  const employees = new AdminEmployeeRepository();
  const employee = await employees.findByEmailNormalized(normalizeEmail(input.email));

  if (!employee || !(await verifyPassword(input.password, employee.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const env = getAuthRuntimeEnv();
  const rawToken = randomUUID() + randomUUID();
  const tokenHash = hashOneTimeCode(rawToken, env.sessionSecret);
  const verificationTokens = new VerificationTokenRepository();

  await verificationTokens.markUsedByActorAndPurpose(
    "admin_employee",
    employee.id,
    "admin_login"
  );
  await verificationTokens.create({
    actorType: "admin_employee",
    actorId: employee.id,
    tenantId: null,
    purpose: "admin_login",
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 15)
  });

  return {
    verificationEmailSent: true,
    verificationToken: rawToken
  };
}

export async function verifyAdminLogin(token: string) {
  const env = getAuthRuntimeEnv();
  const verificationTokens = new VerificationTokenRepository();
  const loginToken = await verificationTokens.findActiveByPurposeAndTokenHash(
    "admin_login",
    hashOneTimeCode(token, env.sessionSecret)
  );

  if (!loginToken || loginToken.actorType !== "admin_employee") {
    throw new ApiError(422, "INVALID_TOKEN", "Admin login token is invalid or expired");
  }

  await withTransaction(async (tx) => {
    const txTokens = new VerificationTokenRepository({ db: tx });
    const txEmployees = new AdminEmployeeRepository({ db: tx });

    await txTokens.markUsed(loginToken.id);
    await txEmployees.updateEmailVerified(loginToken.actorId);
  });
  await createAdminAppSession({
    employeeId: loginToken.actorId
  });

  return {
    verified: true,
    redirectTo: "/admin"
  };
}

export async function sendAdminPasswordReset(email: string) {
  const employees = new AdminEmployeeRepository();
  const employee = await employees.findByEmailNormalized(normalizeEmail(email));

  if (!employee) {
    return { emailSent: true };
  }

  const env = getAuthRuntimeEnv();
  const rawToken = randomUUID() + randomUUID();
  const tokenHash = hashOneTimeCode(rawToken, env.sessionSecret);
  const verificationTokens = new VerificationTokenRepository();

  await verificationTokens.markUsedByActorAndPurpose(
    "admin_employee",
    employee.id,
    "password_reset"
  );
  await verificationTokens.create({
    actorType: "admin_employee",
    actorId: employee.id,
    tenantId: null,
    purpose: "password_reset",
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 30)
  });

  return {
    emailSent: true,
    resetToken: rawToken
  };
}

export async function resetAdminPassword(token: string, password: string) {
  const env = getAuthRuntimeEnv();
  const verificationTokens = new VerificationTokenRepository();
  const resetToken = await verificationTokens.findActiveByPurposeAndTokenHash(
    "password_reset",
    hashOneTimeCode(token, env.sessionSecret)
  );

  if (!resetToken || resetToken.actorType !== "admin_employee") {
    throw new ApiError(422, "INVALID_TOKEN", "Password reset token is invalid or expired");
  }

  const passwordHash = await hashPassword(password);

  await withTransaction(async (tx) => {
    const txEmployees = new AdminEmployeeRepository({ db: tx });
    const txTokens = new VerificationTokenRepository({ db: tx });

    await txEmployees.updatePassword(resetToken.actorId, passwordHash);
    await txTokens.markUsed(resetToken.id);
  });

  return { passwordReset: true };
}

export async function getCurrentActorProfile() {
  const principal = await getCurrentSessionPrincipal();

  if (!principal) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication is required");
  }

  if (principal.actorType === "customer_user") {
    const users = new UserRepository();
    const memberships = new CustomerMembershipRepository();
    const [user, membership] = await Promise.all([
      users.findById(principal.userId),
      memberships.findActiveMembershipByUserId(principal.userId)
    ]);

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    return {
      id: principal.userId,
      actorType: principal.actorType,
      name: principal.name,
      email: principal.email,
      status: principal.status,
      verified: principal.emailVerified,
      role: membership?.roleId
        ? { id: membership.roleId, name: membership.roleName ?? "Unknown" }
        : null,
      department: membership?.departmentId
        ? { id: membership.departmentId, name: membership.departmentName ?? "Unknown" }
        : null,
      permissions: principal.permissions
        .filter((permission) => permission.allowed)
        .map((permission) => `${permission.domain}_${permission.action}`),
      servicePlans: {
        wvs: { availableScans: user.totalScan ?? 0 },
        dms: {
          slots: user.dmsMonitoringSlots,
          active: user.dmsPlanStatus === "active"
        },
        dnsms: {
          slots: user.dnsmsMonitoringSlots,
          active: user.dnsmsPlanStatus === "active"
        }
      }
    };
  }

  return {
    id: principal.employeeId,
    actorType: principal.actorType,
    name: principal.name,
    email: principal.email,
    status: principal.status,
    verified: principal.emailVerified,
    role: principal.roleId ? { id: principal.roleId, name: "Admin Role" } : null,
    department: principal.departmentId
      ? { id: principal.departmentId, name: "Admin Department" }
      : null,
    permissions: principal.permissions
      .filter((permission) => permission.allowed)
      .map((permission) => `${permission.domain}_${permission.action}`)
  };
}

export async function completeGoogleOAuthSignIn(input: {
  email: string | null;
  name: string | null;
  googleId: string | null;
  supabaseAuthUserId: string;
}) {
  if (!input.email) {
    throw new ApiError(422, "GOOGLE_EMAIL_MISSING", "Google did not return an email address");
  }

  if (!input.googleId) {
    throw new ApiError(422, "GOOGLE_ID_MISSING", "Google profile is missing a stable identity");
  }

  const users = new UserRepository();
  const existingByGoogleId = await users.findByGoogleId(input.googleId);

  if (existingByGoogleId) {
    await createCustomerAppSession({
      userId: existingByGoogleId.id,
      tenantId: existingByGoogleId.tenantId
    });

    return {
      userId: existingByGoogleId.id,
      tenantId: existingByGoogleId.tenantId,
      redirectTo: "/user/wvs/dashboard",
      created: false
    };
  }

  const existingByEmail = await users.findByEmailNormalized(normalizeEmail(input.email));

  if (existingByEmail && !existingByEmail.googleId) {
    throw new ApiError(
      409,
      "GOOGLE_EMAIL_CONFLICT",
      "An account already exists with this email and is not linked to Google"
    );
  }

  if (existingByEmail && existingByEmail.googleId) {
    await users.linkGoogleIdentity(
      existingByEmail.id,
      input.googleId,
      input.supabaseAuthUserId
    );
    await createCustomerAppSession({
      userId: existingByEmail.id,
      tenantId: existingByEmail.tenantId
    });

    return {
      userId: existingByEmail.id,
      tenantId: existingByEmail.tenantId,
      redirectTo: "/user/wvs/dashboard",
      created: false
    };
  }

  const userId = randomUUID();
  await users.createPrimaryUser({
    id: userId,
    supabaseAuthUserId: input.supabaseAuthUserId,
    googleId: input.googleId,
    name: input.name?.trim() || input.email,
    email: input.email,
    passwordHash: null,
    contactNumber: null,
    countryCode: null,
    isEmailVerified: true,
    signupMeta: {
      provider: "google"
    }
  });
  await users.verifyEmail(userId);
  await createCustomerAppSession({
    userId,
    tenantId: userId
  });

  return {
    userId,
    tenantId: userId,
    redirectTo: "/user/wvs/dashboard",
    created: true
  };
}
