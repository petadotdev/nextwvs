import { ticketCreateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listTickets, successResponse } =
      await import("../../../../src/lib/tickets");
    return successResponse(await listTickets());
  } catch (error) {
    const { errorResponse } = await import("../../../../src/lib/tickets");
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { createTicket, successResponse } =
      await import("../../../../src/lib/tickets");
    const input = ticketCreateSchema.parse(await request.json());
    return successResponse(await createTicket(input), 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../src/lib/tickets");
    return errorResponse(error);
  }
}
