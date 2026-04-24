export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const [
      { successResponse },
      { getCustomerSessionPrincipal, signOutCustomerSession },
      { getRequestActivityContext, logCustomerActivity }
    ] = await Promise.all([
      import("../../../../../src/lib/auth/api"),
      import("../../../../../src/lib/auth/server"),
      import("../../../../../src/lib/auth/activity")
    ]);
    const principal = await getCustomerSessionPrincipal();
    if (principal) {
      await logCustomerActivity({
        tenantId: principal.tenantId,
        userId: principal.userId,
        action: "signout",
        request: getRequestActivityContext(request)
      });
    }
    await signOutCustomerSession();
    return successResponse({ signedOut: true });
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/auth/api");
    return errorResponse(error);
  }
}
