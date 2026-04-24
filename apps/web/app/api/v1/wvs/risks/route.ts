export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listWvsRiskSummary, successResponse } =
      await import("../../../../../src/lib/wvs");
    return successResponse(await listWvsRiskSummary());
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
