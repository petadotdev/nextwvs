import { customerEmployeeCreateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listCustomerEmployees, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const result = await listCustomerEmployees();
    return successResponse({ employees: result });
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { createCustomerEmployee, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const input = customerEmployeeCreateSchema.parse(await request.json());
    const result = await createCustomerEmployee(input);
    return successResponse({ employee: result }, 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
