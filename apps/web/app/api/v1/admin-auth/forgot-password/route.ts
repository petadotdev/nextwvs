export const dynamic = "force-dynamic";

import { forgotPasswordSchema } from "@petadot/validation";

export async function POST(request: Request) {
  try {
    const { sendAdminPasswordReset, successResponse } = await import(
      "../../../../../src/lib/auth/api"
    );
    const payload = forgotPasswordSchema.parse(await request.json());
    const result = await sendAdminPasswordReset(payload.email);

    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
