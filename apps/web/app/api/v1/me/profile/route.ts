import { customerWorkspaceProfileUpdateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const { updateCustomerWorkspaceProfile, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const input = customerWorkspaceProfileUpdateSchema.parse(await request.json());
    const result = await updateCustomerWorkspaceProfile(input);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
