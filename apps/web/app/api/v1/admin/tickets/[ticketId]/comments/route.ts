import { ticketCommentCreateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ticketId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { ticketId } = await params;
    const { createAdminTicketComment, successResponse } =
      await import("../../../../../../../src/lib/tickets");
    const input = ticketCommentCreateSchema.parse(await request.json());
    return successResponse(
      await createAdminTicketComment(ticketId, input),
      201
    );
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../../../src/lib/tickets");
    return errorResponse(error);
  }
}
