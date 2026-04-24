import { customerStatusUpdateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ departmentId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { departmentId } = await params;
    const { updateCustomerDepartmentStatus, successResponse } = await import(
      "../../../../../../../src/lib/customer-workspace"
    );
    const input = customerStatusUpdateSchema.parse(await request.json());
    const result = await updateCustomerDepartmentStatus(departmentId, input);
    return successResponse({ department: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
