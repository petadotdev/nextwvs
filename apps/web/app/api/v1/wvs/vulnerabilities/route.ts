export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listWvsVulnerabilities, successResponse } =
      await import("../../../../../src/lib/wvs");
    return successResponse(await listWvsVulnerabilities());
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
