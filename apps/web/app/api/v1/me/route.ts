export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { getCurrentActorProfile, successResponse } = await import(
      "../../../../src/lib/auth/api"
    );
    const profile = await getCurrentActorProfile();
    return successResponse(profile);
  } catch (error) {
    const { errorResponse } = await import("../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
