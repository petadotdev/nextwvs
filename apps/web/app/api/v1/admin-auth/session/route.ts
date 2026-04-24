export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const { getAdminSessionPrincipal } = await import(
    "../../../../../src/lib/auth/server"
  );
  const principal = await getAdminSessionPrincipal();

  if (!principal) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Admin session not found"
        }
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: principal
  });
}

export async function DELETE() {
  const { signOutAdminSession } = await import(
    "../../../../../src/lib/auth/server"
  );
  await signOutAdminSession();

  return NextResponse.json({
    success: true,
    data: {
      signedOut: true
    }
  });
}
