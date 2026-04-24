export const dynamic = "force-dynamic";

type Params = { params: Promise<{ scanId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { scanId } = await params;
    const { getWvsScanProgress, successResponse } =
      await import("../../../../../../../src/lib/wvs");
    return successResponse(await getWvsScanProgress(scanId));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
