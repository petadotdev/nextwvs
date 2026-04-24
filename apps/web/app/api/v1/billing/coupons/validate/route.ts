import { billingCouponValidateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { validateBillingCoupon, successResponse } =
      await import("../../../../../../src/lib/billing");
    const input = billingCouponValidateSchema.parse(await request.json());
    const result = await validateBillingCoupon(input);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/billing");
    return errorResponse(error);
  }
}
