import { adminPackageMutationSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ packageId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { packageId } = await params;
    const { updateAdminPackage, successResponse } =
      await import("../../../../../../src/lib/admin-billing");
    const input = adminPackageMutationSchema.parse(await request.json());
    return successResponse(await updateAdminPackage(packageId, input));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { packageId } = await params;
    const { deleteAdminPackage, successResponse } =
      await import("../../../../../../src/lib/admin-billing");
    return successResponse(await deleteAdminPackage(packageId));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}
