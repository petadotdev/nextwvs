export const dynamic = "force-dynamic";

type Params = { params: Promise<{ scanId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { scanId } = await params;
    const { cancelWvsScan, successResponse } =
      await import("../../../../../../../src/lib/wvs");
    return successResponse(await cancelWvsScan(scanId));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
