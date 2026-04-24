export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const { getCustomerSessionPrincipal } = await import(
    "../../../../../src/lib/auth/server"
  );
  const principal = await getCustomerSessionPrincipal();

  if (!principal) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Customer session not found"
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
  const { signOutCustomerSession } = await import(
    "../../../../../src/lib/auth/server"
  );
  await signOutCustomerSession();

  return NextResponse.json({
    success: true,
    data: {
      signedOut: true
    }
  });
}
