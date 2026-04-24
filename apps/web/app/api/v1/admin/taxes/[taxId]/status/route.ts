import { adminStatusMutationSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ taxId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { taxId } = await params;
    const { updateAdminTaxStatus, successResponse } =
      await import("../../../../../../../src/lib/admin-billing");
    const input = adminStatusMutationSchema.parse(await request.json());
    return successResponse(await updateAdminTaxStatus(taxId, input));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}
