import { customerRoleCreateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listCustomerRoles, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const result = await listCustomerRoles();
    return successResponse({ roles: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { createCustomerRole, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const input = customerRoleCreateSchema.parse(await request.json());
    const result = await createCustomerRole(input);
    return successResponse({ role: result }, 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
