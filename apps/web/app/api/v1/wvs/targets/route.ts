import { wvsTargetCreateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listWvsTargets, successResponse } =
      await import("../../../../../src/lib/wvs");
    return successResponse(await listWvsTargets());
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { createWvsTarget, successResponse } =
      await import("../../../../../src/lib/wvs");
    const input = wvsTargetCreateSchema.parse(await request.json());
    return successResponse(await createWvsTarget(input), 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
