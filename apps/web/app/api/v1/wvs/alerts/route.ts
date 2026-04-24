export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listWvsAlerts, successResponse } =
      await import("../../../../../src/lib/wvs");
    return successResponse(await listWvsAlerts());
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
