export const dynamic = "force-dynamic";

type Params = { params: Promise<{ targetId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { targetId } = await params;
    const { sendWvsTargetVerification, successResponse } =
      await import("../../../../../../../src/lib/wvs");
    return successResponse(await sendWvsTargetVerification(targetId));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
