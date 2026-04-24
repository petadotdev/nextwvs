import { notificationPreferencesSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { getCustomerNotificationPreferences, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const result = await getCustomerNotificationPreferences();
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { updateCustomerNotificationPreferences, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const input = notificationPreferencesSchema.parse(await request.json());
    const result = await updateCustomerNotificationPreferences(input);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
