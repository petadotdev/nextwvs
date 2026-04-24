import { adminCouponMutationSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ couponId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { couponId } = await params;
    const { updateAdminCoupon, successResponse } =
      await import("../../../../../../src/lib/admin-billing");
    const input = adminCouponMutationSchema.parse(await request.json());
    return successResponse(await updateAdminCoupon(couponId, input));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { couponId } = await params;
    const { deleteAdminCoupon, successResponse } =
      await import("../../../../../../src/lib/admin-billing");
    return successResponse(await deleteAdminCoupon(couponId));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}
