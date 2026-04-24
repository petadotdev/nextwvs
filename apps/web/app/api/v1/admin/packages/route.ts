import { adminPackageMutationSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { listAdminPackages, successResponse } =
      await import("../../../../../src/lib/admin-billing");
    return successResponse(await listAdminPackages());
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { createAdminPackage, successResponse } =
      await import("../../../../../src/lib/admin-billing");
    const input = adminPackageMutationSchema.parse(await request.json());
    return successResponse(await createAdminPackage(input), 201);
  } catch (error) {
    const { errorResponse } =
      await import("../../../../../src/lib/admin-billing");
    return errorResponse(error);
  }
}
