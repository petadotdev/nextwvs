export const dynamic = "force-dynamic";

import { twoFactorVerifySchema } from "@petadot/validation";

export async function POST(request: Request) {
  try {
    const { errorResponse, successResponse, verifyCustomerTwoFactor } = await import(
      "../../../../../../src/lib/auth/api"
    );
    const payload = twoFactorVerifySchema.parse(await request.json());
    const result = await verifyCustomerTwoFactor(payload.challengeId, payload.code);

    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
