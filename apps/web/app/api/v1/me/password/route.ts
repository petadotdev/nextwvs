import { customerWorkspacePasswordChangeSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const { changeCustomerWorkspacePassword, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const input = customerWorkspacePasswordChangeSchema.parse(await request.json());
    const result = await changeCustomerWorkspacePassword(input);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
