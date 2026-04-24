export const dynamic = "force-dynamic";

type Params = { params: Promise<{ invoiceId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { invoiceId } = await params;
    const { getBillingInvoice, successResponse } =
      await import("../../../../../../src/lib/billing");
    const result = await getBillingInvoice(invoiceId);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/billing");
    return errorResponse(error);
  }
}
