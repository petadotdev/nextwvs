export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listBillingPurchases, successResponse } =
      await import("../../../../../src/lib/billing");
    const result = await listBillingPurchases();
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/billing");
    return errorResponse(error);
  }
}
