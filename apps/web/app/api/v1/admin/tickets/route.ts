export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listAdminTickets, successResponse } =
      await import("../../../../../src/lib/tickets");
    return successResponse(await listAdminTickets());
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/tickets");
    return errorResponse(error);
  }
}
