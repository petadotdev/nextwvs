import { customerStatusUpdateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ employeeId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { employeeId } = await params;
    const { updateCustomerEmployeeStatus, successResponse } = await import(
      "../../../../../../../src/lib/customer-workspace"
    );
    const input = customerStatusUpdateSchema.parse(await request.json());
    const result = await updateCustomerEmployeeStatus(employeeId, input);
    return successResponse({ employee: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
