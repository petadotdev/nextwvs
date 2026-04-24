import { BaseRepository, type JsonValue, type RepositoryContext } from "./index";

export interface CustomerWorkspaceProfileRecord {
  id: string;
  tenantId: string;
  isPrimaryAccount: boolean;
  parentUserId: string | null;
  name: string;
  email: string;
  status: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  contactNumber: string | null;
  countryCode: string | null;
  country: string | null;
  state: string | null;
  companyName: string | null;
  address: string | null;
  gstNumber: string | null;
  taxId: string | null;
  globalUnsub: boolean;
  mailPrefs: Record<string, JsonValue>;
  profileJson: Record<string, JsonValue>;
  billingProfileJson: Record<string, JsonValue>;
  totalScan: number;
  dmsMonitoringSlots: number;
  dmsPlanStatus: string;
  dnsmsMonitoringSlots: number;
  dnsmsPlanStatus: string;
  teamManageAccess: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDashboardSummaryRecord {
  wvsTargets: number;
  wvsScans: number;
  dmsTargets: number;
  dmsActiveTargets: number;
  dnsTargets: number;
  dnsActiveTargets: number;
  openTickets: number;
  activeTeamMembers: number;
  recentActivity: CustomerRecentActivityRecord[];
}

export interface CustomerRecentActivityRecord {
  id: string;
  action: string;
  route: string | null;
  timestampAt: string;
  metadata: Record<string, JsonValue>;
}

export interface CustomerDepartmentSummaryRecord {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  roleCount: number;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRoleSummaryRecord {
  id: string;
  tenantId: string;
  departmentId: string | null;
  departmentName: string | null;
  name: string;
  status: string;
  permissionCount: number;
  employeeCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerEmployeeSummaryRecord {
  id: string;
  tenantId: string;
  parentUserId: string | null;
  isPrimaryAccount: boolean;
  name: string;
  email: string;
  contactNumber: string | null;
  countryCode: string | null;
  status: string;
  teamManageAccess: boolean;
  departmentId: string | null;
  departmentName: string | null;
  roleId: string | null;
  roleName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTeamPermissionRecord {
  id: string;
  roleId: string;
  domain: string;
  action: string;
  allowed: boolean;
}

function toJsonObject(value: JsonValue): Record<string, JsonValue> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return value as Record<string, JsonValue>;
}

function serializeJson(value: Record<string, JsonValue>) {
  return JSON.stringify(value);
}

function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase();
}

export class CustomerWorkspaceRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async findProfileByUserId(userId: string) {
    const [row] = await this.db<CustomerWorkspaceProfileRecord[]>`
      select
        id,
        tenant_id as "tenantId",
        is_primary_account as "isPrimaryAccount",
        parent_user_id as "parentUserId",
        name,
        email,
        status,
        is_email_verified as "isEmailVerified",
        is_phone_verified as "isPhoneVerified",
        two_factor_enabled as "twoFactorEnabled",
        contact_number as "contactNumber",
        country_code as "countryCode",
        country,
        state,
        company_name as "companyName",
        address,
        gst_number as "gstNumber",
        tax_id as "taxId",
        global_unsub as "globalUnsub",
        mail_prefs as "mailPrefs",
        profile_json as "profileJson",
        billing_profile_json as "billingProfileJson",
        total_scan as "totalScan",
        dms_monitoring_slots as "dmsMonitoringSlots",
        dms_plan_status as "dmsPlanStatus",
        dnsms_monitoring_slots as "dnsmsMonitoringSlots",
        dnsms_plan_status as "dnsmsPlanStatus",
        team_manage_access as "teamManageAccess",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.users
      where id = ${userId}
      limit 1
    `;

    if (!row) {
      return null;
    }

    return {
      ...row,
      mailPrefs: toJsonObject(row.mailPrefs as JsonValue),
      profileJson: toJsonObject(row.profileJson as JsonValue),
      billingProfileJson: toJsonObject(row.billingProfileJson as JsonValue)
    } satisfies CustomerWorkspaceProfileRecord;
  }

  async updateProfile(
    userId: string,
    input: {
      name: string;
      contactNumber: string | null;
      countryCode: string | null;
      country: string | null;
      state: string | null;
      companyName: string | null;
      address: string | null;
      gstNumber: string | null;
      taxId: string | null;
    }
  ) {
    const [row] = await this.db<CustomerWorkspaceProfileRecord[]>`
      update public.users
      set
        name = ${input.name},
        contact_number = ${input.contactNumber},
        country_code = ${input.countryCode},
        country = ${input.country},
        state = ${input.state},
        company_name = ${input.companyName},
        address = ${input.address},
        gst_number = ${input.gstNumber},
        tax_id = ${input.taxId}
      where id = ${userId}
      returning
        id,
        tenant_id as "tenantId",
        is_primary_account as "isPrimaryAccount",
        parent_user_id as "parentUserId",
        name,
        email,
        status,
        is_email_verified as "isEmailVerified",
        is_phone_verified as "isPhoneVerified",
        two_factor_enabled as "twoFactorEnabled",
        contact_number as "contactNumber",
        country_code as "countryCode",
        country,
        state,
        company_name as "companyName",
        address,
        gst_number as "gstNumber",
        tax_id as "taxId",
        global_unsub as "globalUnsub",
        mail_prefs as "mailPrefs",
        profile_json as "profileJson",
        billing_profile_json as "billingProfileJson",
        total_scan as "totalScan",
        dms_monitoring_slots as "dmsMonitoringSlots",
        dms_plan_status as "dmsPlanStatus",
        dnsms_monitoring_slots as "dnsmsMonitoringSlots",
        dnsms_plan_status as "dnsmsPlanStatus",
        team_manage_access as "teamManageAccess",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row
      ? {
          ...row,
          mailPrefs: toJsonObject(row.mailPrefs as JsonValue),
          profileJson: toJsonObject(row.profileJson as JsonValue),
          billingProfileJson: toJsonObject(row.billingProfileJson as JsonValue)
        }
      : null;
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.db`
      update public.users
      set password_hash = ${passwordHash}
      where id = ${userId}
    `;
  }

  async updateNotificationPreferences(
    userId: string,
    input: {
      globalUnsub: boolean;
      mailPrefs: Record<string, JsonValue>;
    }
  ) {
    const [row] = await this.db<{
      globalUnsub: boolean;
      mailPrefs: JsonValue;
    }[]>`
      update public.users
      set
        global_unsub = ${input.globalUnsub},
        mail_prefs = ${serializeJson(input.mailPrefs)}::jsonb
      where id = ${userId}
      returning
        global_unsub as "globalUnsub",
        mail_prefs as "mailPrefs"
    `;

    if (!row) {
      return null;
    }

    return {
      globalUnsub: row.globalUnsub,
      mailPrefs: toJsonObject(row.mailPrefs)
    };
  }

  async createFeedback(input: {
    tenantId: string;
    userId: string;
    rating: number;
    message: string;
    featureRequest: string;
    repeatUse: string;
  }) {
    const [row] = await this.db<{
      id: string;
      createdAt: string;
    }[]>`
      insert into public.feedback (
        tenant_id,
        user_id,
        rating,
        message,
        feature_request,
        repeat_use
      ) values (
        ${input.tenantId},
        ${input.userId},
        ${input.rating},
        ${input.message},
        ${input.featureRequest},
        ${input.repeatUse}
      )
      returning
        id,
        created_at as "createdAt"
    `;

    return row;
  }

  async updateSocInterest(
    userId: string,
    socInterest: Record<string, JsonValue>
  ) {
    const [row] = await this.db<{
      profileJson: JsonValue;
    }[]>`
      update public.users
      set profile_json = jsonb_set(
        profile_json,
        '{socInterest}',
        ${serializeJson(socInterest)}::jsonb,
        true
      )
      where id = ${userId}
      returning profile_json as "profileJson"
    `;

    return row ? toJsonObject(row.profileJson) : null;
  }

  async getDashboardSummary(tenantId: string) {
    const [
      [wvsCounts],
      [dmsCounts],
      [dnsCounts],
      [ticketCounts],
      [employeeCounts],
      activityRows
    ] = await Promise.all([
      this.db<[{ total: number; scans: number }?]>`
        select
          count(distinct targets.id)::int as total,
          count(distinct runs.id)::int as scans
        from public.wvs_targets targets
        left join public.wvs_scan_runs runs
          on runs.target_id = targets.id
        where targets.tenant_id = ${tenantId}
      `,
      this.db<[{ total: number; active: number }?]>`
        select
          count(*)::int as total,
          count(*) filter (where monitoring_status = 'start')::int as active
        from public.dms_targets
        where tenant_id = ${tenantId}
      `,
      this.db<[{ total: number; active: number }?]>`
        select
          count(*)::int as total,
          count(*) filter (where monitoring_status = 'start')::int as active
        from public.dns_domains
        where tenant_id = ${tenantId}
      `,
      this.db<[{ total: number }?]>`
        select count(*)::int as total
        from public.tickets
        where tenant_id = ${tenantId}
          and status in ('open', 'in_progress', 'reopened')
      `,
      this.db<[{ total: number }?]>`
        select count(*)::int as total
        from public.users
        where tenant_id = ${tenantId}
          and is_primary_account = false
          and status = 'active'
      `,
      this.db<CustomerRecentActivityRecord[]>`
        select
          id,
          coalesce(action, 'activity') as action,
          route,
          timestamp_at as "timestampAt",
          metadata
        from public.user_activity_logs
        where tenant_id = ${tenantId}
        order by timestamp_at desc
        limit 8
      `
    ]);

    return {
      wvsTargets: wvsCounts?.total ?? 0,
      wvsScans: wvsCounts?.scans ?? 0,
      dmsTargets: dmsCounts?.total ?? 0,
      dmsActiveTargets: dmsCounts?.active ?? 0,
      dnsTargets: dnsCounts?.total ?? 0,
      dnsActiveTargets: dnsCounts?.active ?? 0,
      openTickets: ticketCounts?.total ?? 0,
      activeTeamMembers: employeeCounts?.total ?? 0,
      recentActivity: activityRows.map((row) => ({
        ...row,
        metadata: toJsonObject(row.metadata as JsonValue)
      }))
    } satisfies CustomerDashboardSummaryRecord;
  }
}

export class CustomerDepartmentRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async listByTenantId(tenantId: string) {
    const rows = await this.db<CustomerDepartmentSummaryRecord[]>`
      select
        departments.id,
        departments.tenant_id as "tenantId",
        departments.name,
        departments.status,
        count(distinct roles.id)::int as "roleCount",
        count(distinct memberships.id)::int as "employeeCount",
        departments.created_at as "createdAt",
        departments.updated_at as "updatedAt"
      from public.user_departments departments
      left join public.user_roles roles
        on roles.department_id = departments.id
      left join public.user_memberships memberships
        on memberships.department_id = departments.id
        and memberships.status = 'active'
      where departments.tenant_id = ${tenantId}
      group by departments.id
      order by departments.name asc
    `;

    return rows;
  }

  async findById(tenantId: string, departmentId: string) {
    const [row] = await this.db<CustomerDepartmentSummaryRecord[]>`
      select
        departments.id,
        departments.tenant_id as "tenantId",
        departments.name,
        departments.status,
        count(distinct roles.id)::int as "roleCount",
        count(distinct memberships.id)::int as "employeeCount",
        departments.created_at as "createdAt",
        departments.updated_at as "updatedAt"
      from public.user_departments departments
      left join public.user_roles roles
        on roles.department_id = departments.id
      left join public.user_memberships memberships
        on memberships.department_id = departments.id
        and memberships.status = 'active'
      where departments.tenant_id = ${tenantId}
        and departments.id = ${departmentId}
      group by departments.id
      limit 1
    `;

    return row ?? null;
  }

  async create(tenantId: string, name: string) {
    const [row] = await this.db<CustomerDepartmentSummaryRecord[]>`
      insert into public.user_departments (tenant_id, name)
      values (${tenantId}, ${name})
      returning
        id,
        tenant_id as "tenantId",
        name,
        status,
        0::int as "roleCount",
        0::int as "employeeCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row;
  }

  async updateName(tenantId: string, departmentId: string, name: string) {
    const [row] = await this.db<CustomerDepartmentSummaryRecord[]>`
      update public.user_departments
      set name = ${name}
      where tenant_id = ${tenantId}
        and id = ${departmentId}
      returning
        id,
        tenant_id as "tenantId",
        name,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt",
        0::int as "roleCount",
        0::int as "employeeCount"
    `;

    return row ?? null;
  }

  async updateStatus(tenantId: string, departmentId: string, status: string) {
    const [row] = await this.db<CustomerDepartmentSummaryRecord[]>`
      update public.user_departments
      set status = ${status}
      where tenant_id = ${tenantId}
        and id = ${departmentId}
      returning
        id,
        tenant_id as "tenantId",
        name,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt",
        0::int as "roleCount",
        0::int as "employeeCount"
    `;

    return row ?? null;
  }

  async delete(tenantId: string, departmentId: string) {
    const rows = await this.db`
      delete from public.user_departments
      where tenant_id = ${tenantId}
        and id = ${departmentId}
    `;

    return rows.count > 0;
  }
}

export class CustomerRoleRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async listByTenantId(tenantId: string) {
    const rows = await this.db<CustomerRoleSummaryRecord[]>`
      select
        roles.id,
        roles.tenant_id as "tenantId",
        roles.department_id as "departmentId",
        departments.name as "departmentName",
        roles.name,
        roles.status,
        count(distinct permissions.id)::int as "permissionCount",
        count(distinct memberships.id)::int as "employeeCount",
        array_remove(
          array_agg(
            distinct case
              when permissions.id is null then null
              else permissions.domain || ':' || permissions.action
            end
          ),
          null
        ) as permissions,
        roles.created_at as "createdAt",
        roles.updated_at as "updatedAt"
      from public.user_roles roles
      left join public.user_departments departments
        on departments.id = roles.department_id
      left join public.user_role_permissions permissions
        on permissions.role_id = roles.id
      left join public.user_memberships memberships
        on memberships.role_id = roles.id
        and memberships.status = 'active'
      where roles.tenant_id = ${tenantId}
      group by roles.id, departments.name
      order by roles.name asc
    `;

    return rows;
  }

  async findById(tenantId: string, roleId: string) {
    const [row] = await this.db<CustomerRoleSummaryRecord[]>`
      select
        roles.id,
        roles.tenant_id as "tenantId",
        roles.department_id as "departmentId",
        departments.name as "departmentName",
        roles.name,
        roles.status,
        count(distinct permissions.id)::int as "permissionCount",
        count(distinct memberships.id)::int as "employeeCount",
        array_remove(
          array_agg(
            distinct case
              when permissions.id is null then null
              else permissions.domain || ':' || permissions.action
            end
          ),
          null
        ) as permissions,
        roles.created_at as "createdAt",
        roles.updated_at as "updatedAt"
      from public.user_roles roles
      left join public.user_departments departments
        on departments.id = roles.department_id
      left join public.user_role_permissions permissions
        on permissions.role_id = roles.id
      left join public.user_memberships memberships
        on memberships.role_id = roles.id
        and memberships.status = 'active'
      where roles.tenant_id = ${tenantId}
        and roles.id = ${roleId}
      group by roles.id, departments.name
      limit 1
    `;

    return row ?? null;
  }

  async create(tenantId: string, input: { name: string; departmentId: string | null }) {
    const [row] = await this.db<CustomerRoleSummaryRecord[]>`
      insert into public.user_roles (tenant_id, department_id, name)
      values (${tenantId}, ${input.departmentId}, ${input.name})
      returning
        id,
        tenant_id as "tenantId",
        department_id as "departmentId",
        null::text as "departmentName",
        name,
        status,
        0::int as "permissionCount",
        0::int as "employeeCount",
        '{}'::text[] as permissions,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row;
  }

  async update(
    tenantId: string,
    roleId: string,
    input: { name: string; departmentId: string | null }
  ) {
    const [row] = await this.db<CustomerRoleSummaryRecord[]>`
      update public.user_roles
      set
        name = ${input.name},
        department_id = ${input.departmentId}
      where tenant_id = ${tenantId}
        and id = ${roleId}
      returning
        id,
        tenant_id as "tenantId",
        department_id as "departmentId",
        null::text as "departmentName",
        name,
        status,
        0::int as "permissionCount",
        0::int as "employeeCount",
        '{}'::text[] as permissions,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async updateStatus(tenantId: string, roleId: string, status: string) {
    const [row] = await this.db<CustomerRoleSummaryRecord[]>`
      update public.user_roles
      set status = ${status}
      where tenant_id = ${tenantId}
        and id = ${roleId}
      returning
        id,
        tenant_id as "tenantId",
        department_id as "departmentId",
        null::text as "departmentName",
        name,
        status,
        0::int as "permissionCount",
        0::int as "employeeCount",
        '{}'::text[] as permissions,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async replacePermissions(
    tenantId: string,
    roleId: string,
    permissions: Array<{ domain: string; action: string }>
  ) {
    await this.db`
      delete from public.user_role_permissions
      where tenant_id = ${tenantId}
        and role_id = ${roleId}
    `;

    if (permissions.length === 0) {
      return;
    }

    for (const permission of permissions) {
      await this.db`
        insert into public.user_role_permissions (tenant_id, role_id, domain, action, allowed)
        values (
          ${tenantId},
          ${roleId},
          ${permission.domain},
          ${permission.action},
          true
        )
      `;
    }
  }

  async delete(tenantId: string, roleId: string) {
    const rows = await this.db`
      delete from public.user_roles
      where tenant_id = ${tenantId}
        and id = ${roleId}
    `;

    return rows.count > 0;
  }
}

export class CustomerEmployeeRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async listByTenantId(tenantId: string) {
    const rows = await this.db<CustomerEmployeeSummaryRecord[]>`
      select
        users.id,
        users.tenant_id as "tenantId",
        users.parent_user_id as "parentUserId",
        users.is_primary_account as "isPrimaryAccount",
        users.name,
        users.email,
        users.contact_number as "contactNumber",
        users.country_code as "countryCode",
        users.status,
        users.team_manage_access as "teamManageAccess",
        memberships.department_id as "departmentId",
        departments.name as "departmentName",
        memberships.role_id as "roleId",
        roles.name as "roleName",
        users.created_at as "createdAt",
        users.updated_at as "updatedAt"
      from public.users
      left join public.user_memberships memberships
        on memberships.user_id = users.id
        and memberships.status = 'active'
      left join public.user_departments departments
        on departments.id = memberships.department_id
      left join public.user_roles roles
        on roles.id = memberships.role_id
      where users.tenant_id = ${tenantId}
      order by users.is_primary_account desc, users.created_at asc
    `;

    return rows;
  }

  async findById(tenantId: string, userId: string) {
    const [row] = await this.db<CustomerEmployeeSummaryRecord[]>`
      select
        users.id,
        users.tenant_id as "tenantId",
        users.parent_user_id as "parentUserId",
        users.is_primary_account as "isPrimaryAccount",
        users.name,
        users.email,
        users.contact_number as "contactNumber",
        users.country_code as "countryCode",
        users.status,
        users.team_manage_access as "teamManageAccess",
        memberships.department_id as "departmentId",
        departments.name as "departmentName",
        memberships.role_id as "roleId",
        roles.name as "roleName",
        users.created_at as "createdAt",
        users.updated_at as "updatedAt"
      from public.users
      left join public.user_memberships memberships
        on memberships.user_id = users.id
      left join public.user_departments departments
        on departments.id = memberships.department_id
      left join public.user_roles roles
        on roles.id = memberships.role_id
      where users.tenant_id = ${tenantId}
        and users.id = ${userId}
      limit 1
    `;

    return row ?? null;
  }

  async create(input: {
    id: string;
    tenantId: string;
    parentUserId: string;
    name: string;
    email: string;
    passwordHash: string;
    contactNumber: string | null;
    countryCode: string | null;
    teamManageAccess: boolean;
    departmentId: string | null;
    roleId: string | null;
  }) {
    const [row] = await this.db<CustomerEmployeeSummaryRecord[]>`
      with inserted_user as (
        insert into public.users (
          id,
          tenant_id,
          parent_user_id,
          is_primary_account,
          name,
          email,
          password_hash,
          contact_number,
          country_code,
          is_email_verified,
          status,
          team_manage_access
        ) values (
          ${input.id},
          ${input.tenantId},
          ${input.parentUserId},
          false,
          ${input.name},
          ${input.email},
          ${input.passwordHash},
          ${input.contactNumber},
          ${input.countryCode},
          false,
          'active',
          ${input.teamManageAccess}
        )
        returning *
      ),
      inserted_membership as (
        insert into public.user_memberships (
          tenant_id,
          user_id,
          department_id,
          role_id,
          status
        ) values (
          ${input.tenantId},
          ${input.id},
          ${input.departmentId},
          ${input.roleId},
          'active'
        )
        returning *
      )
      select
        users.id,
        users.tenant_id as "tenantId",
        users.parent_user_id as "parentUserId",
        users.is_primary_account as "isPrimaryAccount",
        users.name,
        users.email,
        users.contact_number as "contactNumber",
        users.country_code as "countryCode",
        users.status,
        users.team_manage_access as "teamManageAccess",
        memberships.department_id as "departmentId",
        departments.name as "departmentName",
        memberships.role_id as "roleId",
        roles.name as "roleName",
        users.created_at as "createdAt",
        users.updated_at as "updatedAt"
      from inserted_user users
      left join inserted_membership memberships
        on memberships.user_id = users.id
      left join public.user_departments departments
        on departments.id = memberships.department_id
      left join public.user_roles roles
        on roles.id = memberships.role_id
    `;

    return row;
  }

  async update(
    tenantId: string,
    userId: string,
    input: {
      name: string;
      email: string;
      contactNumber: string | null;
      countryCode: string | null;
      teamManageAccess: boolean;
      departmentId: string | null;
      roleId: string | null;
    }
  ) {
    const [row] = await this.db<CustomerEmployeeSummaryRecord[]>`
      with updated_user as (
        update public.users
        set
          name = ${input.name},
          email = ${input.email},
          email_normalized = ${normalizeEmailAddress(input.email)},
          contact_number = ${input.contactNumber},
          country_code = ${input.countryCode},
          team_manage_access = ${input.teamManageAccess}
        where tenant_id = ${tenantId}
          and id = ${userId}
        returning *
      ),
      upsert_membership as (
        insert into public.user_memberships (
          tenant_id,
          user_id,
          department_id,
          role_id,
          status
        ) values (
          ${tenantId},
          ${userId},
          ${input.departmentId},
          ${input.roleId},
          'active'
        )
        on conflict (tenant_id, user_id)
        do update
        set
          department_id = excluded.department_id,
          role_id = excluded.role_id,
          status = 'active'
        returning *
      )
      select
        users.id,
        users.tenant_id as "tenantId",
        users.parent_user_id as "parentUserId",
        users.is_primary_account as "isPrimaryAccount",
        users.name,
        users.email,
        users.contact_number as "contactNumber",
        users.country_code as "countryCode",
        users.status,
        users.team_manage_access as "teamManageAccess",
        memberships.department_id as "departmentId",
        departments.name as "departmentName",
        memberships.role_id as "roleId",
        roles.name as "roleName",
        users.created_at as "createdAt",
        users.updated_at as "updatedAt"
      from updated_user users
      left join upsert_membership memberships
        on memberships.user_id = users.id
      left join public.user_departments departments
        on departments.id = memberships.department_id
      left join public.user_roles roles
        on roles.id = memberships.role_id
    `;

    return row ?? null;
  }

  async updateStatus(tenantId: string, userId: string, status: string) {
    const [row] = await this.db<CustomerEmployeeSummaryRecord[]>`
      update public.users
      set status = ${status}
      where tenant_id = ${tenantId}
        and id = ${userId}
      returning
        id,
        tenant_id as "tenantId",
        parent_user_id as "parentUserId",
        is_primary_account as "isPrimaryAccount",
        name,
        email,
        contact_number as "contactNumber",
        country_code as "countryCode",
        status,
        team_manage_access as "teamManageAccess",
        null::uuid as "departmentId",
        null::text as "departmentName",
        null::uuid as "roleId",
        null::text as "roleName",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return row ?? null;
  }

  async delete(tenantId: string, userId: string) {
    const rows = await this.db`
      delete from public.users
      where tenant_id = ${tenantId}
        and id = ${userId}
        and is_primary_account = false
    `;

    return rows.count > 0;
  }

  async getOwnedResourceCounts(tenantId: string, userId: string) {
    const [[row]] = await Promise.all([
      this.db<
        [
          {
            openTickets: number;
            dmsTargets: number;
            dnsTargets: number;
            wvsTargets: number;
          }?
        ]
      >`
        select
          (
            select count(*)::int
            from public.tickets
            where tenant_id = ${tenantId}
              and user_id = ${userId}
              and status in ('open', 'in_progress', 'reopened')
          ) as "openTickets",
          (
            select count(*)::int
            from public.dms_targets
            where tenant_id = ${tenantId}
              and owner_user_id = ${userId}
          ) as "dmsTargets",
          (
            select count(*)::int
            from public.dns_domains
            where tenant_id = ${tenantId}
              and owner_user_id = ${userId}
          ) as "dnsTargets",
          (
            select count(*)::int
            from public.wvs_targets
            where tenant_id = ${tenantId}
              and created_by = ${userId}
          ) as "wvsTargets"
      `
    ]);

    return (
      row ?? {
        openTickets: 0,
        dmsTargets: 0,
        dnsTargets: 0,
        wvsTargets: 0
      }
    );
  }
}
