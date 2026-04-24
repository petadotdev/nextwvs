import { adminStatusMutationSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ couponId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { couponId } = await params;
    const { updateAdminCouponStatus, successResponse } =
      await import("../../../../../../../src/lib/admin-billing");
    const input = adminStatusMutationSchema.parse(await request.json());
    return successResponse(await updateAdminCouponStatus(couponId, input));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}
