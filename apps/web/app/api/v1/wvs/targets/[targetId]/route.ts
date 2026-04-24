export const dynamic = "force-dynamic";

type Params = { params: Promise<{ targetId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { targetId } = await params;
    const { deleteWvsTarget, successResponse } =
      await import("../../../../../../src/lib/wvs");
    return successResponse(await deleteWvsTarget(targetId));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
