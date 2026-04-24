import { billingOrderCreateSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { createPayPalBillingOrder, successResponse } =
      await import("../../../../../../src/lib/billing");
    const input = billingOrderCreateSchema.parse(await request.json());
    const result = await createPayPalBillingOrder(input);
    return successResponse(result, 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../../../src/lib/billing");
    return errorResponse(error);
  }
}
