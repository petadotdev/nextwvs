import { wvsTargetVerifySchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ targetId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { targetId } = await params;
    const { verifyWvsTarget, successResponse } =
      await import("../../../../../../../src/lib/wvs");
    const input = wvsTargetVerifySchema.parse(await request.json());
    return successResponse(await verifyWvsTarget(targetId, input));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
