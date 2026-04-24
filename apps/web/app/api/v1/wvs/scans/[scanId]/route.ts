export const dynamic = "force-dynamic";

type Params = { params: Promise<{ scanId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { scanId } = await params;
    const { getWvsScan, successResponse } =
      await import("../../../../../../src/lib/wvs");
    return successResponse(await getWvsScan(scanId));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
