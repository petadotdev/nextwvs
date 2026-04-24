import { adminCouponMutationSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listAdminCoupons, successResponse } =
      await import("../../../../../src/lib/admin-billing");
    return successResponse(await listAdminCoupons());
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { createAdminCoupon, successResponse } =
      await import("../../../../../src/lib/admin-billing");
    const input = adminCouponMutationSchema.parse(await request.json());
    return successResponse(await createAdminCoupon(input), 201);
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}
