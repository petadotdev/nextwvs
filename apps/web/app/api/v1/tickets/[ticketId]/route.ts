export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ticketId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { ticketId } = await params;
    const { getTicket, successResponse } =
      await import("../../../../../src/lib/tickets");
    return successResponse(await getTicket(ticketId));
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/tickets");
    return errorResponse(error);
  }
}
