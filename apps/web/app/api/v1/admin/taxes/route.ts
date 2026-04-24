import { adminTaxMutationSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listAdminTaxes, successResponse } =
      await import("../../../../../src/lib/admin-billing");
    return successResponse(await listAdminTaxes());
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { createAdminTax, successResponse } =
      await import("../../../../../src/lib/admin-billing");
    const input = adminTaxMutationSchema.parse(await request.json());
    return successResponse(await createAdminTax(input), 201);
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}
