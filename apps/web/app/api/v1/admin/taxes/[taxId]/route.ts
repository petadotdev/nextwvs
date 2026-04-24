import { adminTaxMutationSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ taxId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { taxId } = await params;
    const { updateAdminTax, successResponse } =
      await import("../../../../../../src/lib/admin-billing");
    const input = adminTaxMutationSchema.parse(await request.json());
    return successResponse(await updateAdminTax(taxId, input));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { taxId } = await params;
    const { deleteAdminTax, successResponse } =
      await import("../../../../../../src/lib/admin-billing");
    return successResponse(await deleteAdminTax(taxId));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}
