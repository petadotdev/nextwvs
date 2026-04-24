export const dynamic = "force-dynamic";

import { phoneSendOtpSchema } from "@petadot/validation";

export async function POST(request: Request) {
  try {
    const { sendPhoneOtp, successResponse } = await import(
      "../../../../../../src/lib/auth/api"
    );
    const payload = phoneSendOtpSchema.parse(await request.json());
    const result = await sendPhoneOtp(
      payload.userId,
      payload.contactNumber,
      payload.countryCode
    );

    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
