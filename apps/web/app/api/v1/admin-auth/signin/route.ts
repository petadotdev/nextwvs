export const dynamic = "force-dynamic";

import { adminSignInSchema } from "@petadot/validation";

export async function POST(request: Request) {
  try {
    const [
      { signInAdmin, successResponse },
      { getRequestActivityContext, logEmployeeActivity },
      { AdminEmployeeRepository },
      { normalizeEmail }
    ] = await Promise.all([
      import("../../../../../src/lib/auth/api"),
      import("../../../../../src/lib/auth/activity"),
      import("@petadot/db"),
      import("@petadot/auth")
    ]);
    const payload = adminSignInSchema.parse(await request.json());
    const result = await signInAdmin(payload);
    const employee = await new AdminEmployeeRepository().findByEmailNormalized(
      normalizeEmail(payload.email)
    );

    if (employee) {
      await logEmployeeActivity({
        employeeId: employee.id,
        action: "admin_signin_verification_sent",
        request: getRequestActivityContext(request)
      });
    }

    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
