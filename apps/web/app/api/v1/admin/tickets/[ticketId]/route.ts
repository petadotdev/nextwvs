export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ticketId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { ticketId } = await params;
    const { getAdminTicket, successResponse } =
      await import("../../../../../../src/lib/tickets");
    return successResponse(await getAdminTicket(ticketId));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/tickets");
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { ticketId } = await params;
    const { deleteAdminTicket, successResponse } =
      await import("../../../../../../src/lib/tickets");
    return successResponse(await deleteAdminTicket(ticketId));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/tickets");
    return errorResponse(error);
  }
}
