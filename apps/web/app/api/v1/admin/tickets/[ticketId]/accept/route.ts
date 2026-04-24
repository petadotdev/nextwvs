export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ticketId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { ticketId } = await params;
    const { acceptAdminTicket, successResponse } =
      await import("../../../../../../../src/lib/tickets");
    return successResponse(await acceptAdminTicket(ticketId));
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../../src/lib/tickets");
    return errorResponse(error);
  }
}
