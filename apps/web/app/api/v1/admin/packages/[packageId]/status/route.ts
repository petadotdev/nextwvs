import { adminStatusMutationSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ packageId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { packageId } = await params;
    const { updateAdminPackageStatus, successResponse } =
      await import("../../../../../../../src/lib/admin-billing");
    const input = adminStatusMutationSchema.parse(await request.json());
    return successResponse(await updateAdminPackageStatus(packageId, input));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}
