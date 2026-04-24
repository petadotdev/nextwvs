export const dynamic = "force-dynamic";

import { customerSignInSchema } from "@petadot/validation";

export async function POST(request: Request) {
  try {
    const [
      { signInCustomer, successResponse },
      { getRequestActivityContext, logCustomerActivity },
      { getCustomerSessionPrincipal }
    ] = await Promise.all([
      import("../../../../../src/lib/auth/api"),
      import("../../../../../src/lib/auth/activity"),
      import("../../../../../src/lib/auth/server")
    ]);
    const payload = customerSignInSchema.parse(await request.json());
    const result = await signInCustomer(payload);
    const principal = await getCustomerSessionPrincipal();

    if (principal && !result.requires2fa) {
      await logCustomerActivity({
        tenantId: principal.tenantId,
        userId: principal.userId,
        action: "signin_success",
        request: getRequestActivityContext(request),
        metadata: {
          requires2fa: false
        }
      });
    }

    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
