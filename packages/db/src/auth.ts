import type { ActorType } from "@petadot/auth";
import { BaseRepository, type RepositoryContext } from "./index";

export interface UserRecord {
  id: string;
  tenantId: string;
  parentUserId: string | null;
  supabaseAuthUserId: string | null;
  isPrimaryAccount: boolean;
  name: string;
  email: string;
  emailNormalized: string;
  googleId: string | null;
  passwordHash: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecretEncrypted: string | null;
  totalScan: number;
  dmsMonitoringSlots: number;
  dmsPlanStatus: string;
  dnsmsMonitoringSlots: number;
  dnsmsPlanStatus: string;
  status: string;
  lockUntil: string | null;
  failedLoginAttempts: number;
  teamManageAccess: boolean;
}

export interface AdminEmployeeRecord {
  id: string;
  departmentId: string | null;
  roleId: string | null;
  name: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  isEmailVerified: boolean;
  status: string;
  lockUntil: string | null;
  failedLoginAttempts: number;
}

export interface PermissionRecord {
  domain: string;
  action: string;
  allowed: boolean;
}

export interface CustomerMembershipRecord {
  tenantId: string;
  userId: string;
  roleId: string | null;
  departmentId: string | null;
  roleName: string | null;
  departmentName: string | null;
  status: string;
}

export interface CustomerSessionRecord {
  id: string;
  userId: string;
  tenantId: string;
  sessionTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string | null;
}

export interface AdminSessionRecord {
  id: string;
  employeeId: string;
  sessionTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string | null;
}

export interface VerificationTokenRecord {
  id: string;
  actorType: ActorType;
  actorId: string;
  tenantId: string | null;
  purpose: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface OtpChallengeRecord {
  id: string;
  actorType: ActorType;
  actorId: string;
  tenantId: string | null;
  provider: string;
  channel: string;
  destinationMasked: string | null;
  providerRequestId: string | null;
  codeHash: string | null;
  attemptCount: number;
  maxAttempts: number;
  expiresAt: string;
  verifiedAt: string | null;
  createdAt: string;
}

export interface UserActivityLogRecord {
  tenantId: string;
  userId: string;
  action: string | null;
  method: string | null;
  route: string | null;
  ip: string | null;
  userAgent: string | null;
  timestampAt: string;
  dateText: string | null;
  metadata: Record<string, unknown>;
}

export interface EmployeeActivityLogRecord {
  employeeId: string;
  action: string | null;
  method: string | null;
  route: string | null;
  ip: string | null;
  userAgent: string | null;
  timestampAt: string;
  dateText: string | null;
  metadata: Record<string, unknown>;
}

function mapPermissionRow(row: {
  domain: string;
  action: string;
  allowed: boolean;
}): PermissionRecord {
  return {
    domain: row.domain,
    action: row.action,
    allowed: row.allowed
  };
}

export class UserRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async findByEmailNormalized(emailNormalized: string) {
    const [row] = await this.db<{
      id: string;
      tenant_id: string;
      parent_user_id: string | null;
      supabase_auth_user_id: string | null;
      is_primary_account: boolean;
      name: string;
      email: string;
      email_normalized: string;
      google_id: string | null;
      password_hash: string | null;
      is_email_verified: boolean;
      is_phone_verified: boolean;
      two_factor_enabled: boolean;
      two_factor_secret_encrypted: string | null;
      total_scan: number;
      dms_monitoring_slots: number;
      dms_plan_status: string;
      dnsms_monitoring_slots: number;
      dnsms_plan_status: string;
      status: string;
      lock_until: string | null;
      failed_login_attempts: number;
      team_manage_access: boolean;
    }[]>`
      select
        id,
        tenant_id,
        parent_user_id,
        supabase_auth_user_id,
        is_primary_account,
        name,
        email,
        email_normalized,
        google_id,
        password_hash,
        is_email_verified,
        is_phone_verified,
        two_factor_enabled,
        two_factor_secret_encrypted,
        total_scan,
        dms_monitoring_slots,
        dms_plan_status,
        dnsms_monitoring_slots,
        dnsms_plan_status,
        status,
        lock_until,
        failed_login_attempts,
        team_manage_access
      from public.users
      where email_normalized = ${emailNormalized}
      limit 1
    `;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      tenantId: row.tenant_id,
      parentUserId: row.parent_user_id,
      supabaseAuthUserId: row.supabase_auth_user_id,
      isPrimaryAccount: row.is_primary_account,
      name: row.name,
      email: row.email,
      emailNormalized: row.email_normalized,
      googleId: row.google_id,
      passwordHash: row.password_hash,
      isEmailVerified: row.is_email_verified,
      isPhoneVerified: row.is_phone_verified,
      twoFactorEnabled: row.two_factor_enabled,
      twoFactorSecretEncrypted: row.two_factor_secret_encrypted,
      totalScan: row.total_scan,
      dmsMonitoringSlots: row.dms_monitoring_slots,
      dmsPlanStatus: row.dms_plan_status,
      dnsmsMonitoringSlots: row.dnsms_monitoring_slots,
      dnsmsPlanStatus: row.dnsms_plan_status,
      status: row.status,
      lockUntil: row.lock_until,
      failedLoginAttempts: row.failed_login_attempts,
      teamManageAccess: row.team_manage_access
    } satisfies UserRecord;
  }

  async findById(userId: string) {
    const [row] = await this.db<UserRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        parent_user_id as "parentUserId",
        supabase_auth_user_id as "supabaseAuthUserId",
        is_primary_account as "isPrimaryAccount",
        name,
        email,
        email_normalized as "emailNormalized",
        google_id as "googleId",
        password_hash as "passwordHash",
        is_email_verified as "isEmailVerified",
        is_phone_verified as "isPhoneVerified",
        two_factor_enabled as "twoFactorEnabled",
        two_factor_secret_encrypted as "twoFactorSecretEncrypted",
        total_scan as "totalScan",
        dms_monitoring_slots as "dmsMonitoringSlots",
        dms_plan_status as "dmsPlanStatus",
        dnsms_monitoring_slots as "dnsmsMonitoringSlots",
        dnsms_plan_status as "dnsmsPlanStatus",
        status,
        lock_until as "lockUntil",
        failed_login_attempts as "failedLoginAttempts",
        team_manage_access as "teamManageAccess"
      from public.users
      where id = ${userId}
      limit 1
    `;

    return row ?? null;
  }

  async markCustomerLogin(userId: string, ipAddress: string | null) {
    await this.db`
      update public.users
      set
        last_login_at = timezone('utc', now()),
        last_login_ip = ${ipAddress}::inet,
        failed_login_attempts = 0,
        lock_until = null
      where id = ${userId}
    `;
  }

  async findByGoogleId(googleId: string) {
    const [row] = await this.db<UserRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        parent_user_id as "parentUserId",
        supabase_auth_user_id as "supabaseAuthUserId",
        is_primary_account as "isPrimaryAccount",
        name,
        email,
        email_normalized as "emailNormalized",
        google_id as "googleId",
        password_hash as "passwordHash",
        is_email_verified as "isEmailVerified",
        is_phone_verified as "isPhoneVerified",
        two_factor_enabled as "twoFactorEnabled",
        two_factor_secret_encrypted as "twoFactorSecretEncrypted",
        total_scan as "totalScan",
        dms_monitoring_slots as "dmsMonitoringSlots",
        dms_plan_status as "dmsPlanStatus",
        dnsms_monitoring_slots as "dnsmsMonitoringSlots",
        dnsms_plan_status as "dnsmsPlanStatus",
        status,
        lock_until as "lockUntil",
        failed_login_attempts as "failedLoginAttempts",
        team_manage_access as "teamManageAccess"
      from public.users
      where google_id = ${googleId}
      limit 1
    `;

    return row ?? null;
  }

  async createPrimaryUser(input: {
    id: string;
    supabaseAuthUserId: string | null;
    googleId?: string | null;
    name: string;
    email: string;
    passwordHash: string | null;
    contactNumber: string | null;
    countryCode: string | null;
    isEmailVerified?: boolean;
    signupMeta?: Record<string, unknown>;
  }) {
    const [row] = await this.db<UserRecord[]>`
      insert into public.users (
        id,
        tenant_id,
        supabase_auth_user_id,
        google_id,
        is_primary_account,
        name,
        email,
        password_hash,
        contact_number,
        country_code,
        is_email_verified,
        signup_meta,
        status
      ) values (
        ${input.id},
        ${input.id},
        ${input.supabaseAuthUserId},
        ${input.googleId ?? null},
        true,
        ${input.name},
        ${input.email},
        ${input.passwordHash},
        ${input.contactNumber},
        ${input.countryCode},
        ${input.isEmailVerified ?? false},
        ${JSON.stringify(input.signupMeta ?? {})}::jsonb,
        'active'
      )
      returning
        id,
        tenant_id as "tenantId",
        parent_user_id as "parentUserId",
        supabase_auth_user_id as "supabaseAuthUserId",
        is_primary_account as "isPrimaryAccount",
        name,
        email,
        email_normalized as "emailNormalized",
        google_id as "googleId",
        password_hash as "passwordHash",
        is_email_verified as "isEmailVerified",
        is_phone_verified as "isPhoneVerified",
        two_factor_enabled as "twoFactorEnabled",
        two_factor_secret_encrypted as "twoFactorSecretEncrypted",
        total_scan as "totalScan",
        dms_monitoring_slots as "dmsMonitoringSlots",
        dms_plan_status as "dmsPlanStatus",
        dnsms_monitoring_slots as "dnsmsMonitoringSlots",
        dnsms_plan_status as "dnsmsPlanStatus",
        status,
        lock_until as "lockUntil",
        failed_login_attempts as "failedLoginAttempts",
        team_manage_access as "teamManageAccess"
    `;

    return row;
  }

  async linkGoogleIdentity(userId: string, googleId: string, supabaseAuthUserId: string | null) {
    await this.db`
      update public.users
      set
        google_id = ${googleId},
        supabase_auth_user_id = coalesce(${supabaseAuthUserId}, supabase_auth_user_id),
        is_email_verified = true,
        email_verified_at = coalesce(email_verified_at, timezone('utc', now()))
      where id = ${userId}
    `;
  }

  async verifyEmail(userId: string) {
    await this.db`
      update public.users
      set
        is_email_verified = true,
        email_verified_at = timezone('utc', now()),
        status = 'active'
      where id = ${userId}
    `;
  }

  async verifyPhone(userId: string) {
    await this.db`
      update public.users
      set
        is_phone_verified = true,
        phone_verified_at = timezone('utc', now())
      where id = ${userId}
    `;
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.db`
      update public.users
      set password_hash = ${passwordHash}
      where id = ${userId}
    `;
  }
}

export class CustomerMembershipRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async findActiveMembershipByUserId(userId: string) {
    const [row] = await this.db<CustomerMembershipRecord[]>`
      select
        memberships.tenant_id as "tenantId",
        memberships.user_id as "userId",
        memberships.role_id as "roleId",
        memberships.department_id as "departmentId",
        roles.name as "roleName",
        departments.name as "departmentName",
        memberships.status
      from public.user_memberships memberships
      left join public.user_roles roles
        on roles.id = memberships.role_id
      left join public.user_departments departments
        on departments.id = memberships.department_id
      where memberships.user_id = ${userId}
        and memberships.status = 'active'
      order by memberships.created_at asc
      limit 1
    `;

    return row ?? null;
  }

  async listPermissionsForUser(userId: string) {
    const rows = await this.db<PermissionRecord[]>`
      select
        permissions.domain,
        permissions.action,
        permissions.allowed
      from public.user_memberships memberships
      inner join public.user_role_permissions permissions
        on permissions.role_id = memberships.role_id
      where memberships.user_id = ${userId}
        and memberships.status = 'active'
    `;

    return rows.map(mapPermissionRow);
  }
}

export class AdminEmployeeRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async findByEmailNormalized(emailNormalized: string) {
    const [row] = await this.db<AdminEmployeeRecord[]>`
      select
        employees.id,
        employees.department_id as "departmentId",
        employees.role_id as "roleId",
        employees.name,
        employees.email,
        employees.email_normalized as "emailNormalized",
        employees.password_hash as "passwordHash",
        employees.is_email_verified as "isEmailVerified",
        employees.status,
        employees.lock_until as "lockUntil",
        employees.failed_login_attempts as "failedLoginAttempts"
      from public.admin_employees employees
      left join public.admin_roles roles
        on roles.id = employees.role_id
      left join public.admin_departments departments
        on departments.id = employees.department_id
      where employees.email_normalized = ${emailNormalized}
        and employees.status = 'active'
        and (roles.id is null or roles.status = 'active')
        and (departments.id is null or departments.status = 'active')
      limit 1
    `;

    return row ?? null;
  }

  async findById(employeeId: string) {
    const [row] = await this.db<AdminEmployeeRecord[]>`
      select
        id,
        department_id as "departmentId",
        role_id as "roleId",
        name,
        email,
        email_normalized as "emailNormalized",
        password_hash as "passwordHash",
        is_email_verified as "isEmailVerified",
        status,
        lock_until as "lockUntil",
        failed_login_attempts as "failedLoginAttempts"
      from public.admin_employees
      where id = ${employeeId}
      limit 1
    `;

    return row ?? null;
  }

  async listPermissionsForEmployee(employeeId: string) {
    const rows = await this.db<PermissionRecord[]>`
      select
        permissions.domain,
        permissions.action,
        permissions.allowed
      from public.admin_employees employees
      inner join public.admin_role_permissions permissions
        on permissions.role_id = employees.role_id
      where employees.id = ${employeeId}
    `;

    return rows.map(mapPermissionRow);
  }

  async markAdminLogin(employeeId: string, ipAddress: string | null) {
    await this.db`
      update public.admin_employees
      set
        last_login_at = timezone('utc', now()),
        last_login_ip = ${ipAddress}::inet,
        failed_login_attempts = 0,
        lock_until = null
      where id = ${employeeId}
    `;
  }

  async updatePassword(employeeId: string, passwordHash: string) {
    await this.db`
      update public.admin_employees
      set password_hash = ${passwordHash}
      where id = ${employeeId}
    `;
  }

  async updateEmailVerified(employeeId: string) {
    await this.db`
      update public.admin_employees
      set is_email_verified = true
      where id = ${employeeId}
    `;
  }
}

export class CustomerSessionRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async create(input: {
    userId: string;
    tenantId: string;
    sessionTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }) {
    const [row] = await this.db<CustomerSessionRecord[]>`
      insert into public.customer_sessions (
        user_id,
        tenant_id,
        session_token_hash,
        user_agent,
        ip_address,
        expires_at
      ) values (
        ${input.userId},
        ${input.tenantId},
        ${input.sessionTokenHash},
        ${input.userAgent},
        ${input.ipAddress}::inet,
        ${input.expiresAt.toISOString()}
      )
      returning
        id,
        user_id as "userId",
        tenant_id as "tenantId",
        session_token_hash as "sessionTokenHash",
        user_agent as "userAgent",
        ip_address::text as "ipAddress",
        created_at as "createdAt",
        expires_at as "expiresAt",
        revoked_at as "revokedAt",
        last_seen_at as "lastSeenAt"
    `;

    return row;
  }

  async findActiveByTokenHash(sessionTokenHash: string) {
    const [row] = await this.db<CustomerSessionRecord[]>`
      select
        id,
        user_id as "userId",
        tenant_id as "tenantId",
        session_token_hash as "sessionTokenHash",
        user_agent as "userAgent",
        ip_address::text as "ipAddress",
        created_at as "createdAt",
        expires_at as "expiresAt",
        revoked_at as "revokedAt",
        last_seen_at as "lastSeenAt"
      from public.customer_sessions
      where session_token_hash = ${sessionTokenHash}
        and revoked_at is null
        and expires_at > timezone('utc', now())
      limit 1
    `;

    return row ?? null;
  }

  async touch(sessionId: string) {
    await this.db`
      update public.customer_sessions
      set last_seen_at = timezone('utc', now())
      where id = ${sessionId}
    `;
  }

  async revokeById(sessionId: string) {
    await this.db`
      update public.customer_sessions
      set revoked_at = timezone('utc', now())
      where id = ${sessionId}
        and revoked_at is null
    `;
  }

  async revokeAllForUserExcept(userId: string, keepSessionId: string, keepLatestCount: number) {
    if (keepLatestCount < 1) {
      await this.db`
        update public.customer_sessions
        set revoked_at = timezone('utc', now())
        where user_id = ${userId}
          and revoked_at is null
          and id <> ${keepSessionId}
      `;
      return;
    }

    await this.db`
      with ranked as (
        select
          id,
          row_number() over (
            order by created_at desc
          ) as row_number
        from public.customer_sessions
        where user_id = ${userId}
          and revoked_at is null
      )
      update public.customer_sessions sessions
      set revoked_at = timezone('utc', now())
      from ranked
      where sessions.id = ranked.id
        and ranked.row_number > ${keepLatestCount}
        and sessions.id <> ${keepSessionId}
    `;
  }
}

export class AdminSessionRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async create(input: {
    employeeId: string;
    sessionTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }) {
    const [row] = await this.db<AdminSessionRecord[]>`
      insert into public.admin_sessions (
        employee_id,
        session_token_hash,
        user_agent,
        ip_address,
        expires_at
      ) values (
        ${input.employeeId},
        ${input.sessionTokenHash},
        ${input.userAgent},
        ${input.ipAddress}::inet,
        ${input.expiresAt.toISOString()}
      )
      returning
        id,
        employee_id as "employeeId",
        session_token_hash as "sessionTokenHash",
        user_agent as "userAgent",
        ip_address::text as "ipAddress",
        created_at as "createdAt",
        expires_at as "expiresAt",
        revoked_at as "revokedAt",
        last_seen_at as "lastSeenAt"
    `;

    return row;
  }

  async findActiveByTokenHash(sessionTokenHash: string) {
    const [row] = await this.db<AdminSessionRecord[]>`
      select
        id,
        employee_id as "employeeId",
        session_token_hash as "sessionTokenHash",
        user_agent as "userAgent",
        ip_address::text as "ipAddress",
        created_at as "createdAt",
        expires_at as "expiresAt",
        revoked_at as "revokedAt",
        last_seen_at as "lastSeenAt"
      from public.admin_sessions
      where session_token_hash = ${sessionTokenHash}
        and revoked_at is null
        and expires_at > timezone('utc', now())
      limit 1
    `;

    return row ?? null;
  }

  async touch(sessionId: string) {
    await this.db`
      update public.admin_sessions
      set last_seen_at = timezone('utc', now())
      where id = ${sessionId}
    `;
  }

  async revokeById(sessionId: string) {
    await this.db`
      update public.admin_sessions
      set revoked_at = timezone('utc', now())
      where id = ${sessionId}
        and revoked_at is null
    `;
  }
}

export class VerificationTokenRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async create(input: {
    actorType: ActorType;
    actorId: string;
    tenantId: string | null;
    purpose: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const [row] = await this.db<VerificationTokenRecord[]>`
      insert into public.verification_tokens (
        actor_type,
        actor_id,
        tenant_id,
        purpose,
        token_hash,
        expires_at
      ) values (
        ${input.actorType},
        ${input.actorId},
        ${input.tenantId},
        ${input.purpose},
        ${input.tokenHash},
        ${input.expiresAt.toISOString()}
      )
      returning
        id,
        actor_type as "actorType",
        actor_id as "actorId",
        tenant_id as "tenantId",
        purpose,
        token_hash as "tokenHash",
        expires_at as "expiresAt",
        used_at as "usedAt",
        created_at as "createdAt"
    `;

    return row;
  }

  async markUsedByActorAndPurpose(
    actorType: ActorType,
    actorId: string,
    purpose: string
  ) {
    await this.db`
      update public.verification_tokens
      set used_at = timezone('utc', now())
      where actor_type = ${actorType}
        and actor_id = ${actorId}
        and purpose = ${purpose}
        and used_at is null
    `;
  }

  async findActiveByPurposeAndTokenHash(purpose: string, tokenHash: string) {
    const [row] = await this.db<VerificationTokenRecord[]>`
      select
        id,
        actor_type as "actorType",
        actor_id as "actorId",
        tenant_id as "tenantId",
        purpose,
        token_hash as "tokenHash",
        expires_at as "expiresAt",
        used_at as "usedAt",
        created_at as "createdAt"
      from public.verification_tokens
      where purpose = ${purpose}
        and token_hash = ${tokenHash}
        and used_at is null
        and expires_at > timezone('utc', now())
      limit 1
    `;

    return row ?? null;
  }

  async markUsed(tokenId: string) {
    await this.db`
      update public.verification_tokens
      set used_at = timezone('utc', now())
      where id = ${tokenId}
        and used_at is null
    `;
  }
}

export class OtpChallengeRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async create(input: {
    actorType: ActorType;
    actorId: string;
    tenantId: string | null;
    provider: string;
    channel: string;
    destinationMasked: string | null;
    providerRequestId: string | null;
    codeHash: string | null;
    maxAttempts?: number;
    expiresAt: Date;
  }) {
    const [row] = await this.db<OtpChallengeRecord[]>`
      insert into public.otp_challenges (
        actor_type,
        actor_id,
        tenant_id,
        provider,
        channel,
        destination_masked,
        provider_request_id,
        code_hash,
        max_attempts,
        expires_at
      ) values (
        ${input.actorType},
        ${input.actorId},
        ${input.tenantId},
        ${input.provider},
        ${input.channel},
        ${input.destinationMasked},
        ${input.providerRequestId},
        ${input.codeHash},
        ${input.maxAttempts ?? 5},
        ${input.expiresAt.toISOString()}
      )
      returning
        id,
        actor_type as "actorType",
        actor_id as "actorId",
        tenant_id as "tenantId",
        provider,
        channel,
        destination_masked as "destinationMasked",
        provider_request_id as "providerRequestId",
        code_hash as "codeHash",
        attempt_count as "attemptCount",
        max_attempts as "maxAttempts",
        expires_at as "expiresAt",
        verified_at as "verifiedAt",
        created_at as "createdAt"
    `;

    return row;
  }

  async findById(challengeId: string) {
    const [row] = await this.db<OtpChallengeRecord[]>`
      select
        id,
        actor_type as "actorType",
        actor_id as "actorId",
        tenant_id as "tenantId",
        provider,
        channel,
        destination_masked as "destinationMasked",
        provider_request_id as "providerRequestId",
        code_hash as "codeHash",
        attempt_count as "attemptCount",
        max_attempts as "maxAttempts",
        expires_at as "expiresAt",
        verified_at as "verifiedAt",
        created_at as "createdAt"
      from public.otp_challenges
      where id = ${challengeId}
      limit 1
    `;

    return row ?? null;
  }

  async incrementAttempt(challengeId: string) {
    await this.db`
      update public.otp_challenges
      set attempt_count = attempt_count + 1
      where id = ${challengeId}
    `;
  }

  async markVerified(challengeId: string) {
    await this.db`
      update public.otp_challenges
      set verified_at = timezone('utc', now())
      where id = ${challengeId}
    `;
  }
}

export class UserActivityLogRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async create(input: UserActivityLogRecord) {
    await this.db`
      insert into public.user_activity_logs (
        tenant_id,
        user_id,
        action,
        method,
        route,
        ip,
        user_agent,
        timestamp_at,
        date_text,
        metadata
      ) values (
        ${input.tenantId},
        ${input.userId},
        ${input.action},
        ${input.method},
        ${input.route},
        ${input.ip}::inet,
        ${input.userAgent},
        ${input.timestampAt},
        ${input.dateText},
        ${JSON.stringify(input.metadata)}::jsonb
      )
    `;
  }
}

export class EmployeeActivityLogRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async create(input: EmployeeActivityLogRecord) {
    await this.db`
      insert into public.employee_activity_logs (
        employee_id,
        action,
        method,
        route,
        ip,
        user_agent,
        timestamp_at,
        date_text,
        metadata
      ) values (
        ${input.employeeId},
        ${input.action},
        ${input.method},
        ${input.route},
        ${input.ip}::inet,
        ${input.userAgent},
        ${input.timestampAt},
        ${input.dateText},
        ${JSON.stringify(input.metadata)}::jsonb
      )
    `;
  }
}
