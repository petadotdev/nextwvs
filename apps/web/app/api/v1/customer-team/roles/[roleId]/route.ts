import { customerRoleUpdateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roleId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { roleId } = await params;
    const { updateCustomerRole, successResponse } = await import(
      "../../../../../../src/lib/customer-workspace"
    );
    const input = customerRoleUpdateSchema.parse(await request.json());
    const result = await updateCustomerRole(roleId, input);
    return successResponse({ role: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { roleId } = await params;
    const { deleteCustomerRole, successResponse } = await import(
      "../../../../../../src/lib/customer-workspace"
    );
    const result = await deleteCustomerRole(roleId);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
