export const dynamic = "force-dynamic";

import { customerSignUpSchema } from "@petadot/validation";

export async function POST(request: Request) {
  try {
    const [
      { signUpCustomer, successResponse },
      { getRequestActivityContext, logCustomerActivity }
    ] = await Promise.all([
      import("../../../../../src/lib/auth/api"),
      import("../../../../../src/lib/auth/activity")
    ]);
    const payload = customerSignUpSchema.parse(await request.json());
    const result = await signUpCustomer(payload);
    await logCustomerActivity({
      tenantId: result.userId,
      userId: result.userId,
      action: "signup_success",
      request: getRequestActivityContext(request),
      metadata: {
        requiresEmailVerification: result.requiresEmailVerification
      }
    });

    return successResponse(result, 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
