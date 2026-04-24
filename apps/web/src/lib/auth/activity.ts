import {
  EmployeeActivityLogRepository,
  UserActivityLogRepository
} from "@petadot/db";

export interface RequestActivityContext {
  method: string;
  route: string;
  ip: string | null;
  userAgent: string | null;
}

export function getRequestActivityContext(request: Request): RequestActivityContext {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    method: request.method,
    route: new URL(request.url).pathname,
    ip: forwardedFor?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent")
  };
}

export async function logCustomerActivity(input: {
  tenantId: string;
  userId: string;
  action: string;
  request: RequestActivityContext;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date();

  await new UserActivityLogRepository().create({
    tenantId: input.tenantId,
    userId: input.userId,
    action: input.action,
    method: input.request.method,
    route: input.request.route,
    ip: input.request.ip,
    userAgent: input.request.userAgent,
    timestampAt: now.toISOString(),
    dateText: now.toISOString().slice(0, 10),
    metadata: input.metadata ?? {}
  });
}

export async function logEmployeeActivity(input: {
  employeeId: string;
  action: string;
  request: RequestActivityContext;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date();

  await new EmployeeActivityLogRepository().create({
    employeeId: input.employeeId,
    action: input.action,
    method: input.request.method,
    route: input.request.route,
    ip: input.request.ip,
    userAgent: input.request.userAgent,
    timestampAt: now.toISOString(),
    dateText: now.toISOString().slice(0, 10),
    metadata: input.metadata ?? {}
  });
}
