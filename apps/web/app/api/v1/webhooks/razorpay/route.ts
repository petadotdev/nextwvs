export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { handleRazorpayWebhook, successResponse } =
      await import("../../../../../src/lib/razorpay-webhook");
    const result = await handleRazorpayWebhook(request);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../src/lib/razorpay-webhook");
    return errorResponse(error);
  }
}
