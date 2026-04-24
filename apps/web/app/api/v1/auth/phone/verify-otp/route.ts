export const dynamic = "force-dynamic";

import { phoneVerifyOtpSchema } from "@petadot/validation";

export async function POST(request: Request) {
  try {
    const { successResponse, verifyPhoneOtp } = await import(
      "../../../../../../src/lib/auth/api"
    );
    const payload = phoneVerifyOtpSchema.parse(await request.json());
    const result = await verifyPhoneOtp(
      payload.challengeId,
      payload.userId,
      payload.code
    );

    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
