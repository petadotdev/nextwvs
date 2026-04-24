import { wvsScanScheduleSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ scanId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { scanId } = await params;
    const { scheduleWvsScan, successResponse } =
      await import("../../../../../../../src/lib/wvs");
    const input = wvsScanScheduleSchema.parse(await request.json());
    return successResponse(await scheduleWvsScan(scanId, input));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { scanId } = await params;
    const { cancelWvsScanSchedule, successResponse } =
      await import("../../../../../../../src/lib/wvs");
    return successResponse(await cancelWvsScanSchedule(scanId));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
