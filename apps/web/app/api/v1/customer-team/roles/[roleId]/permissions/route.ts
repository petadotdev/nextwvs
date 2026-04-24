import { customerRolePermissionsUpdateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roleId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { roleId } = await params;
    const { updateCustomerRolePermissions, successResponse } = await import(
      "../../../../../../../src/lib/customer-workspace"
    );
    const input = customerRolePermissionsUpdateSchema.parse(await request.json());
    const result = await updateCustomerRolePermissions(roleId, input);
    return successResponse({ role: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
