export const dynamic = "force-dynamic";

import { z } from "zod";

const schema = z.object({
  token: z.string().trim().min(20)
});

export async function POST(request: Request) {
  try {
    const [
      { successResponse, verifyCustomerEmail },
      { getRequestActivityContext, logCustomerActivity },
      { getAuthRuntimeEnv },
      { hashOneTimeCode },
      { VerificationTokenRepository }
    ] = await Promise.all([
      import("../../../../../src/lib/auth/api"),
      import("../../../../../src/lib/auth/activity"),
      import("../../../../../src/lib/auth/env"),
      import("@petadot/auth"),
      import("@petadot/db")
    ]);
    const payload = schema.parse(await request.json());
    const env = getAuthRuntimeEnv();
    const verificationToken = await new VerificationTokenRepository().findActiveByPurposeAndTokenHash(
      "email_verification",
      hashOneTimeCode(payload.token, env.sessionSecret)
    );
    const result = await verifyCustomerEmail(payload.token);

    if (verificationToken?.tenantId) {
      await logCustomerActivity({
        tenantId: verificationToken.tenantId,
        userId: verificationToken.actorId,
        action: "email_verification_success",
        request: getRequestActivityContext(request)
      });
    }

    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
