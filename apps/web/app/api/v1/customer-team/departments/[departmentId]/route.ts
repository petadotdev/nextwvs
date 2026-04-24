import { customerDepartmentUpdateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ departmentId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { departmentId } = await params;
    const { updateCustomerDepartment, successResponse } = await import(
      "../../../../../../src/lib/customer-workspace"
    );
    const input = customerDepartmentUpdateSchema.parse(await request.json());
    const result = await updateCustomerDepartment(departmentId, input);
    return successResponse({ department: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { departmentId } = await params;
    const { deleteCustomerDepartment, successResponse } = await import(
      "../../../../../../src/lib/customer-workspace"
    );
    const result = await deleteCustomerDepartment(departmentId);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
