import { randomUUID } from "node:crypto";
import { hashPassword, hasPermission, normalizeEmail, verifyPassword } from "@petadot/auth";
import {
  CustomerDepartmentRepository,
  CustomerEmployeeRepository,
  CustomerRoleRepository,
  CustomerWorkspaceRepository,
  UserRepository,
  withTransaction
} from "@petadot/db";
import type {
  CustomerDepartmentCreateInput,
  CustomerDepartmentUpdateInput,
  CustomerEmployeeCreateInput,
  CustomerEmployeeUpdateInput,
  CustomerRoleCreateInput,
  CustomerRolePermissionsUpdateInput,
  CustomerRoleUpdateInput,
  CustomerStatusUpdateInput,
  CustomerWorkspacePasswordChangeInput,
  CustomerWorkspaceProfileUpdateInput,
  FeedbackSubmissionInput,
  NotificationPreferencesInput,
  SocInterestSubmissionInput
} from "@petadot/validation";
import { createSupabaseAdminClient } from "./supabase/admin";
import { ApiError, errorResponse, successResponse } from "./auth/api";
import { requireCustomerSession } from "./auth/server";

const DEFAULT_NOTIFICATION_PREFERENCES = {
  paymentSuccess: true,
  paymentFailure: true,
  paymentPending: true,
  scanStarted: true,
  scanCompleted: true,
  scanFailed: true,
  targetCreated: false,
  targetDeleted: false,
  ticketCreated: true,
  ticketUpdated: true,
  vulnerabilityNotifications: true
} as const;

function asObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeNotificationPreferences(source: Record<string, unknown> | null | undefined) {
  const values = asObject(source ?? {});

  return {
    paymentSuccess: Boolean(values.paymentSuccess ?? DEFAULT_NOTIFICATION_PREFERENCES.paymentSuccess),
    paymentFailure: Boolean(values.paymentFailure ?? DEFAULT_NOTIFICATION_PREFERENCES.paymentFailure),
    paymentPending: Boolean(values.paymentPending ?? DEFAULT_NOTIFICATION_PREFERENCES.paymentPending),
    scanStarted: Boolean(values.scanStarted ?? DEFAULT_NOTIFICATION_PREFERENCES.scanStarted),
    scanCompleted: Boolean(values.scanCompleted ?? DEFAULT_NOTIFICATION_PREFERENCES.scanCompleted),
    scanFailed: Boolean(values.scanFailed ?? DEFAULT_NOTIFICATION_PREFERENCES.scanFailed),
    targetCreated: Boolean(values.targetCreated ?? DEFAULT_NOTIFICATION_PREFERENCES.targetCreated),
    targetDeleted: Boolean(values.targetDeleted ?? DEFAULT_NOTIFICATION_PREFERENCES.targetDeleted),
    ticketCreated: Boolean(values.ticketCreated ?? DEFAULT_NOTIFICATION_PREFERENCES.ticketCreated),
    ticketUpdated: Boolean(values.ticketUpdated ?? DEFAULT_NOTIFICATION_PREFERENCES.ticketUpdated),
    vulnerabilityNotifications: Boolean(
      values.vulnerabilityNotifications ??
        DEFAULT_NOTIFICATION_PREFERENCES.vulnerabilityNotifications
    )
  };
}

function mapDatabaseError(error: unknown, duplicateCode: string, duplicateMessage: string) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);

    if (code === "23505") {
      return new ApiError(409, duplicateCode, duplicateMessage);
    }

    if (code === "23503") {
      return new ApiError(422, "RELATED_RECORD_NOT_FOUND", "A referenced record does not exist");
    }
  }

  return error;
}

async function maybeUpdateSupabasePassword(supabaseAuthUserId: string | null, password: string) {
  if (!supabaseAuthUserId) {
    return;
  }

  const client = createSupabaseAdminClient();
  const result = await client.auth.admin.updateUserById(supabaseAuthUserId, {
    password
  });

  if (result.error) {
    throw new ApiError(500, "SUPABASE_AUTH_UPDATE_FAILED", result.error.message);
  }
}

async function getWorkspaceActorContext() {
  const principal = await requireCustomerSession();
  const workspace = new CustomerWorkspaceRepository();
  const profile = await workspace.findProfileByUserId(principal.userId);

  if (!profile) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return {
    principal,
    profile
  };
}

function assertTeamAccess(
  context: Awaited<ReturnType<typeof getWorkspaceActorContext>>,
  permission?: { domain: string; action: string }
) {
  if (
    context.profile.isPrimaryAccount ||
    context.principal.teamManageAccess ||
    (permission &&
      hasPermission(context.principal.permissions, permission.domain, permission.action))
  ) {
    return;
  }

  throw new ApiError(
    403,
    "FORBIDDEN",
    "You do not have permission to manage customer team resources"
  );
}

async function ensureDepartmentAssignable(tenantId: string, departmentId: string | null | undefined) {
  if (!departmentId) {
    return null;
  }

  const repository = new CustomerDepartmentRepository();
  const department = await repository.findById(tenantId, departmentId);

  if (!department) {
    throw new ApiError(404, "DEPARTMENT_NOT_FOUND", "Department not found");
  }

  if (department.status !== "active") {
    throw new ApiError(422, "DEPARTMENT_INACTIVE", "Department must be active");
  }

  return department;
}

async function ensureRoleAssignable(tenantId: string, roleId: string | null | undefined) {
  if (!roleId) {
    return null;
  }

  const repository = new CustomerRoleRepository();
  const role = await repository.findById(tenantId, roleId);

  if (!role) {
    throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found");
  }

  if (role.status !== "active") {
    throw new ApiError(422, "ROLE_INACTIVE", "Role must be active");
  }

  return role;
}

function splitPermissionKeys(input: string[]) {
  return input.map((permission) => {
    const [domain, action] = permission.split(":");
    return { domain, action };
  });
}

export async function getCustomerWorkspaceDashboard() {
  const context = await getWorkspaceActorContext();
  const workspace = new CustomerWorkspaceRepository();
  const dashboard = await workspace.getDashboardSummary(context.principal.tenantId);

  return {
    actor: {
      id: context.profile.id,
      name: context.profile.name,
      email: context.profile.email,
      status: context.profile.status,
      verified: context.profile.isEmailVerified
    },
    servicePlans: {
      wvs: { availableScans: context.profile.totalScan ?? 0 },
      dms: {
        slots: context.profile.dmsMonitoringSlots,
        active: context.profile.dmsPlanStatus === "active"
      },
      dnsms: {
        slots: context.profile.dnsmsMonitoringSlots,
        active: context.profile.dnsmsPlanStatus === "active"
      }
    },
    summary: dashboard
  };
}

export async function getCustomerWorkspaceProfileDetails() {
  const { profile } = await getWorkspaceActorContext();
  const socInterest = asObject(profile.profileJson.socInterest);

  return {
    id: profile.id,
    tenantId: profile.tenantId,
    name: profile.name,
    email: profile.email,
    status: profile.status,
    verified: profile.isEmailVerified,
    contactNumber: profile.contactNumber,
    countryCode: profile.countryCode,
    country: profile.country,
    state: profile.state,
    companyName: profile.companyName,
    address: profile.address,
    gstNumber: profile.gstNumber,
    taxId: profile.taxId,
    teamManageAccess: profile.teamManageAccess,
    isPrimaryAccount: profile.isPrimaryAccount,
    twoFactorEnabled: profile.twoFactorEnabled,
    globalUnsub: profile.globalUnsub,
    socInterest: Object.keys(socInterest).length > 0 ? socInterest : null
  };
}

export async function updateCustomerWorkspaceProfile(
  input: CustomerWorkspaceProfileUpdateInput
) {
  const context = await getWorkspaceActorContext();
  const normalizedEmail = input.email ? normalizeEmail(input.email) : context.profile.email;

  if (normalizedEmail !== normalizeEmail(context.profile.email)) {
    throw new ApiError(
      422,
      "EMAIL_CHANGE_NOT_SUPPORTED",
      "Email changes are not supported in this Phase 4 slice"
    );
  }

  const workspace = new CustomerWorkspaceRepository();
  const updated = await workspace.updateProfile(context.principal.userId, {
    name: input.name,
    contactNumber: input.contactNumber ?? null,
    countryCode: input.countryCode ?? null,
    country: input.country ?? null,
    state: input.state ?? null,
    companyName: input.companyName ?? null,
    address: input.address ?? null,
    gstNumber: input.gstNumber ?? null,
    taxId: input.taxId ?? null
  });

  if (!updated) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return {
    profileUpdated: true,
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      contactNumber: updated.contactNumber,
      companyName: updated.companyName,
      country: updated.country,
      state: updated.state,
      gstNumber: updated.gstNumber
    }
  };
}

export async function changeCustomerWorkspacePassword(
  input: CustomerWorkspacePasswordChangeInput
) {
  const context = await getWorkspaceActorContext();
  const user = await new UserRepository().findById(context.principal.userId);

  if (!user || !user.passwordHash) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  const matches = await verifyPassword(input.currentPassword, user.passwordHash);

  if (!matches) {
    throw new ApiError(422, "PASSWORD_INCORRECT", "Current password is incorrect");
  }

  const passwordHash = await hashPassword(input.newPassword);
  await withTransaction(async (tx) => {
    const workspace = new CustomerWorkspaceRepository({ db: tx });
    await workspace.updatePassword(context.principal.userId, passwordHash);
  });
  await maybeUpdateSupabasePassword(user.supabaseAuthUserId, input.newPassword);

  return { passwordUpdated: true };
}

export async function getCustomerNotificationPreferences() {
  const { profile } = await getWorkspaceActorContext();
  const preferences = normalizeNotificationPreferences(profile.mailPrefs);

  return {
    ...preferences,
    globalUnsub: profile.globalUnsub
  };
}

export async function updateCustomerNotificationPreferences(
  input: NotificationPreferencesInput
) {
  const context = await getWorkspaceActorContext();
  const current = normalizeNotificationPreferences(context.profile.mailPrefs);
  const merged = {
    ...current,
    ...input
  };
  const globalUnsub = input.globalUnsub ?? context.profile.globalUnsub;

  const workspace = new CustomerWorkspaceRepository();
  const updated = await workspace.updateNotificationPreferences(context.principal.userId, {
    globalUnsub,
    mailPrefs: {
      paymentSuccess: merged.paymentSuccess,
      paymentFailure: merged.paymentFailure,
      paymentPending: merged.paymentPending,
      scanStarted: merged.scanStarted,
      scanCompleted: merged.scanCompleted,
      scanFailed: merged.scanFailed,
      targetCreated: merged.targetCreated,
      targetDeleted: merged.targetDeleted,
      ticketCreated: merged.ticketCreated,
      ticketUpdated: merged.ticketUpdated,
      vulnerabilityNotifications: merged.vulnerabilityNotifications
    }
  });

  if (!updated) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return {
    preferencesUpdated: true,
    preferences: {
      ...normalizeNotificationPreferences(updated.mailPrefs),
      globalUnsub: updated.globalUnsub
    }
  };
}

export async function submitCustomerFeedback(input: FeedbackSubmissionInput) {
  const context = await getWorkspaceActorContext();
  const workspace = new CustomerWorkspaceRepository();
  const feedback = await workspace.createFeedback({
    tenantId: context.principal.tenantId,
    userId: context.principal.userId,
    rating: input.rating,
    message: input.message,
    featureRequest: input.featureRequest,
    repeatUse: input.repeatUse
  });

  return {
    feedbackSubmitted: true,
    feedbackId: feedback.id,
    createdAt: feedback.createdAt
  };
}

export async function submitCustomerSocInterest(input: SocInterestSubmissionInput) {
  const context = await getWorkspaceActorContext();
  const existingSocInterest = asObject(context.profile.profileJson.socInterest);

  if (existingSocInterest.submittedAt) {
    throw new ApiError(
      409,
      "SOC_INTEREST_ALREADY_SUBMITTED",
      "SOC interest has already been submitted"
    );
  }

  const workspace = new CustomerWorkspaceRepository();
  const updatedProfileJson = await workspace.updateSocInterest(context.principal.userId, {
    useCase: input.useCase,
    companySize: input.companySize,
    contactPreference: input.contactPreference,
    notes: input.notes,
    submittedAt: new Date().toISOString()
  });

  return {
    socInterestSubmitted: true,
    socInterest: asObject(updatedProfileJson?.socInterest)
  };
}

export async function listCustomerDepartments() {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "team", action: "view" });
  return new CustomerDepartmentRepository().listByTenantId(context.principal.tenantId);
}

export async function createCustomerDepartment(input: CustomerDepartmentCreateInput) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "departments", action: "create" });

  try {
    return await new CustomerDepartmentRepository().create(context.principal.tenantId, input.name);
  } catch (error) {
    throw mapDatabaseError(
      error,
      "DEPARTMENT_ALREADY_EXISTS",
      "A department with that name already exists"
    );
  }
}

export async function updateCustomerDepartment(
  departmentId: string,
  input: CustomerDepartmentUpdateInput
) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "departments", action: "update" });

  try {
    const updated = await new CustomerDepartmentRepository().updateName(
      context.principal.tenantId,
      departmentId,
      input.name
    );

    if (!updated) {
      throw new ApiError(404, "DEPARTMENT_NOT_FOUND", "Department not found");
    }

    return updated;
  } catch (error) {
    throw mapDatabaseError(
      error,
      "DEPARTMENT_ALREADY_EXISTS",
      "A department with that name already exists"
    );
  }
}

export async function updateCustomerDepartmentStatus(
  departmentId: string,
  input: CustomerStatusUpdateInput
) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "departments", action: "status" });
  const repository = new CustomerDepartmentRepository();
  const current = await repository.findById(context.principal.tenantId, departmentId);

  if (!current) {
    throw new ApiError(404, "DEPARTMENT_NOT_FOUND", "Department not found");
  }

  if (input.status === "inactive" && (current.roleCount > 0 || current.employeeCount > 0)) {
    throw new ApiError(
      409,
      "DEPARTMENT_IN_USE",
      "Cannot deactivate a department with active roles or employees"
    );
  }

  const updated = await repository.updateStatus(context.principal.tenantId, departmentId, input.status);

  if (!updated) {
    throw new ApiError(404, "DEPARTMENT_NOT_FOUND", "Department not found");
  }

  return updated;
}

export async function deleteCustomerDepartment(departmentId: string) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "departments", action: "delete" });
  const repository = new CustomerDepartmentRepository();
  const current = await repository.findById(context.principal.tenantId, departmentId);

  if (!current) {
    throw new ApiError(404, "DEPARTMENT_NOT_FOUND", "Department not found");
  }

  if (current.roleCount > 0 || current.employeeCount > 0) {
    throw new ApiError(
      409,
      "DEPARTMENT_IN_USE",
      "Cannot delete a department with attached roles or employees"
    );
  }

  await repository.delete(context.principal.tenantId, departmentId);
  return { deleted: true };
}

export async function listCustomerRoles() {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "team", action: "view" });
  return new CustomerRoleRepository().listByTenantId(context.principal.tenantId);
}

export async function createCustomerRole(input: CustomerRoleCreateInput) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "roles", action: "create" });
  await ensureDepartmentAssignable(context.principal.tenantId, input.departmentId);
  const repository = new CustomerRoleRepository();

  try {
    const created = await repository.create(context.principal.tenantId, {
      name: input.name,
      departmentId: input.departmentId ?? null
    });
    await repository.replacePermissions(
      context.principal.tenantId,
      created.id,
      splitPermissionKeys(input.permissions)
    );
    return repository.findById(context.principal.tenantId, created.id);
  } catch (error) {
    throw mapDatabaseError(error, "ROLE_ALREADY_EXISTS", "A role with that name already exists");
  }
}

export async function updateCustomerRole(roleId: string, input: CustomerRoleUpdateInput) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "roles", action: "update" });
  await ensureDepartmentAssignable(context.principal.tenantId, input.departmentId);
  const repository = new CustomerRoleRepository();

  try {
    const updated = await repository.update(context.principal.tenantId, roleId, {
      name: input.name,
      departmentId: input.departmentId ?? null
    });

    if (!updated) {
      throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found");
    }

    return repository.findById(context.principal.tenantId, roleId);
  } catch (error) {
    throw mapDatabaseError(error, "ROLE_ALREADY_EXISTS", "A role with that name already exists");
  }
}

export async function updateCustomerRoleStatus(roleId: string, input: CustomerStatusUpdateInput) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "roles", action: "status" });
  const repository = new CustomerRoleRepository();
  const current = await repository.findById(context.principal.tenantId, roleId);

  if (!current) {
    throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found");
  }

  if (input.status === "inactive" && current.employeeCount > 0) {
    throw new ApiError(
      409,
      "ROLE_IN_USE",
      "Cannot deactivate a role that is assigned to employees"
    );
  }

  const updated = await repository.updateStatus(context.principal.tenantId, roleId, input.status);

  if (!updated) {
    throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found");
  }

  return repository.findById(context.principal.tenantId, roleId);
}

export async function updateCustomerRolePermissions(
  roleId: string,
  input: CustomerRolePermissionsUpdateInput
) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "roles", action: "permissions" });
  const repository = new CustomerRoleRepository();
  const current = await repository.findById(context.principal.tenantId, roleId);

  if (!current) {
    throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found");
  }

  await repository.replacePermissions(
    context.principal.tenantId,
    roleId,
    splitPermissionKeys(input.permissions)
  );
  return repository.findById(context.principal.tenantId, roleId);
}

export async function deleteCustomerRole(roleId: string) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "roles", action: "delete" });
  const repository = new CustomerRoleRepository();
  const current = await repository.findById(context.principal.tenantId, roleId);

  if (!current) {
    throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found");
  }

  if (current.employeeCount > 0) {
    throw new ApiError(
      409,
      "ROLE_IN_USE",
      "Cannot delete a role that is assigned to employees"
    );
  }

  await repository.delete(context.principal.tenantId, roleId);
  return { deleted: true };
}

export async function listCustomerEmployees() {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "team", action: "view" });
  return new CustomerEmployeeRepository().listByTenantId(context.principal.tenantId);
}

export async function createCustomerEmployee(input: CustomerEmployeeCreateInput) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "employees", action: "create" });
  await ensureDepartmentAssignable(context.principal.tenantId, input.departmentId);
  await ensureRoleAssignable(context.principal.tenantId, input.roleId);

  const repository = new CustomerEmployeeRepository();
  try {
    return await repository.create({
      id: randomUUID(),
      tenantId: context.principal.tenantId,
      parentUserId: context.principal.userId,
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      contactNumber: input.contactNumber ?? null,
      countryCode: input.countryCode ?? null,
      teamManageAccess: input.teamManageAccess ?? false,
      departmentId: input.departmentId ?? null,
      roleId: input.roleId ?? null
    });
  } catch (error) {
    throw mapDatabaseError(error, "EMPLOYEE_ALREADY_EXISTS", "An employee with that email already exists");
  }
}

export async function updateCustomerEmployee(
  employeeId: string,
  input: CustomerEmployeeUpdateInput
) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "employees", action: "update" });
  await ensureDepartmentAssignable(context.principal.tenantId, input.departmentId);
  await ensureRoleAssignable(context.principal.tenantId, input.roleId);
  const repository = new CustomerEmployeeRepository();
  const existing = await repository.findById(context.principal.tenantId, employeeId);

  if (!existing) {
    throw new ApiError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
  }

  if (existing.isPrimaryAccount) {
    throw new ApiError(422, "PRIMARY_ACCOUNT_LOCKED", "Primary account cannot be edited here");
  }

  try {
    return await repository.update(context.principal.tenantId, employeeId, {
      name: input.name,
      email: input.email,
      contactNumber: input.contactNumber ?? null,
      countryCode: input.countryCode ?? null,
      teamManageAccess: input.teamManageAccess ?? false,
      departmentId: input.departmentId ?? null,
      roleId: input.roleId ?? null
    });
  } catch (error) {
    throw mapDatabaseError(error, "EMPLOYEE_ALREADY_EXISTS", "An employee with that email already exists");
  }
}

export async function updateCustomerEmployeeStatus(
  employeeId: string,
  input: CustomerStatusUpdateInput
) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "employees", action: "status" });
  const repository = new CustomerEmployeeRepository();
  const existing = await repository.findById(context.principal.tenantId, employeeId);

  if (!existing) {
    throw new ApiError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
  }

  if (existing.isPrimaryAccount) {
    throw new ApiError(422, "PRIMARY_ACCOUNT_LOCKED", "Primary account cannot be deactivated");
  }

  return repository.updateStatus(context.principal.tenantId, employeeId, input.status);
}

export async function deleteCustomerEmployee(employeeId: string) {
  const context = await getWorkspaceActorContext();
  assertTeamAccess(context, { domain: "employees", action: "delete" });
  const repository = new CustomerEmployeeRepository();
  const existing = await repository.findById(context.principal.tenantId, employeeId);

  if (!existing) {
    throw new ApiError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
  }

  if (existing.isPrimaryAccount) {
    throw new ApiError(422, "PRIMARY_ACCOUNT_LOCKED", "Primary account cannot be deleted");
  }

  const ownedResources = await repository.getOwnedResourceCounts(context.principal.tenantId, employeeId);
  if (
    ownedResources.openTickets > 0 ||
    ownedResources.dmsTargets > 0 ||
    ownedResources.dnsTargets > 0 ||
    ownedResources.wvsTargets > 0
  ) {
    throw new ApiError(
      409,
      "EMPLOYEE_HAS_OWNED_RESOURCES",
      "Employee owns unresolved tickets or assets and cannot be deleted"
    );
  }

  await repository.delete(context.principal.tenantId, employeeId);
  return { deleted: true };
}

export { errorResponse, successResponse };
