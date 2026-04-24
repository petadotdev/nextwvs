import { wvsScanCreateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listWvsScans, successResponse } =
      await import("../../../../../src/lib/wvs");
    return successResponse(await listWvsScans());
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { startWvsScan, successResponse } =
      await import("../../../../../src/lib/wvs");
    const input = wvsScanCreateSchema.parse(await request.json());
    return successResponse(await startWvsScan(input), 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
