import { customerDepartmentCreateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listCustomerDepartments, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const result = await listCustomerDepartments();
    return successResponse({ departments: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { createCustomerDepartment, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const input = customerDepartmentCreateSchema.parse(await request.json());
    const result = await createCustomerDepartment(input);
    return successResponse({ department: result }, 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
