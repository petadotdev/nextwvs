import { customerStatusUpdateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roleId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { roleId } = await params;
    const { updateCustomerRoleStatus, successResponse } = await import(
      "../../../../../../../src/lib/customer-workspace"
    );
    const input = customerStatusUpdateSchema.parse(await request.json());
    const result = await updateCustomerRoleStatus(roleId, input);
    return successResponse({ role: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
