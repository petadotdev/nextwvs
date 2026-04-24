import { paypalPaymentCaptureSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { capturePayPalBillingPayment, successResponse } =
      await import("../../../../../../../src/lib/billing");
    const input = paypalPaymentCaptureSchema.parse(await request.json());
    const result = await capturePayPalBillingPayment(input);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../../src/lib/billing");
    return errorResponse(error);
  }
}
