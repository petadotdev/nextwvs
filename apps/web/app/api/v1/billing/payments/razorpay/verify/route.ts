import { razorpayPaymentVerifySchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { verifyRazorpayBillingPayment, successResponse } =
      await import("../../../../../../../src/lib/billing");
    const input = razorpayPaymentVerifySchema.parse(await request.json());
    const result = await verifyRazorpayBillingPayment(input);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../../src/lib/billing");
    return errorResponse(error);
  }
}
