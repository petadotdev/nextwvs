import { wvsRetryConfigSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ scanId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { scanId } = await params;
    const { updateWvsRetryConfig, successResponse } =
      await import("../../../../../../../src/lib/wvs");
    const input = wvsRetryConfigSchema.parse(await request.json());
    return successResponse(await updateWvsRetryConfig(scanId, input));
  } catch (error) {
    const { errorResponse } = await import("../../../../../../../src/lib/wvs");
    return errorResponse(error);
  }
}
