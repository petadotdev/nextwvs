export const dynamic = "force-dynamic";

import { resetPasswordSchema } from "@petadot/validation";

export async function POST(request: Request) {
  try {
    const { resetCustomerPassword, successResponse } = await import(
      "../../../../../src/lib/auth/api"
    );
    const payload = resetPasswordSchema.parse(await request.json());
    const result = await resetCustomerPassword(payload.token, payload.password);

    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
