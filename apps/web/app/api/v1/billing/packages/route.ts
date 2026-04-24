import { billingPackageQuerySchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { listBillingPackages, successResponse } =
      await import("../../../../../src/lib/billing");
    const url = new URL(request.url);
    const query = billingPackageQuerySchema.parse({
      serviceType: url.searchParams.get("serviceType") ?? undefined
    });
    const result = await listBillingPackages(query);
    return successResponse(result);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/billing");
    return errorResponse(error);
  }
}
