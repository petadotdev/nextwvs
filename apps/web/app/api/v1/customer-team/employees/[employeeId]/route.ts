import { customerEmployeeUpdateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ employeeId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { employeeId } = await params;
    const { updateCustomerEmployee, successResponse } = await import(
      "../../../../../../src/lib/customer-workspace"
    );
    const input = customerEmployeeUpdateSchema.parse(await request.json());
    const result = await updateCustomerEmployee(employeeId, input);
    return successResponse({ employee: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { employeeId } = await params;
    const { deleteCustomerEmployee, successResponse } = await import(
      "../../../../../../src/lib/customer-workspace"
    );
    const result = await deleteCustomerEmployee(employeeId);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
