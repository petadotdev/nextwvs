export const dynamic = "force-dynamic";

import { z } from "zod";

const schema = z.object({
  token: z.string().trim().min(20)
});

export async function POST(request: Request) {
  try {
    const [
      { errorResponse, successResponse, verifyAdminLogin },
      { getRequestActivityContext, logEmployeeActivity },
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
    const loginToken = await new VerificationTokenRepository().findActiveByPurposeAndTokenHash(
      "admin_login",
      hashOneTimeCode(payload.token, env.sessionSecret)
    );
    const result = await verifyAdminLogin(payload.token);

    if (loginToken) {
      await logEmployeeActivity({
        employeeId: loginToken.actorId,
        action: "admin_verify_login_success",
        request: getRequestActivityContext(request)
      });
    }

    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
