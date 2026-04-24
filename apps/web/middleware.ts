import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export function middleware(request: NextRequest) {
  const purpose = request.headers.get("purpose");
  const prefetch = request.headers.get("next-router-prefetch");
  const secFetchMode = request.headers.get("sec-fetch-mode");
  const secFetchDest = request.headers.get("sec-fetch-dest");

  if (
    purpose === "prefetch" ||
    prefetch === "1" ||
    secFetchMode === "cors" ||
    (secFetchDest !== null && secFetchDest !== "document")
  ) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const customerCookieName =
    process.env.SESSION_COOKIE_NAME_USER?.trim() || "pd_user_session";
  const adminCookieName =
    process.env.SESSION_COOKIE_NAME_ADMIN?.trim() || "pd_admin_session";
  const customerSession = request.cookies.get(customerCookieName)?.value;
  const adminSession = request.cookies.get(adminCookieName)?.value;

  if (pathname.startsWith("/user") && !customerSession) {
    const signinUrl = new URL("/auth/signin", request.url);
    signinUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signinUrl);
  }

  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/admin/forgot-password") &&
    !pathname.startsWith("/admin/reset-password") &&
    !pathname.startsWith("/admin/verify-login") &&
    !adminSession
  ) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/auth") && customerSession) {
    return redirectTo(request, "/user/wvs/dashboard");
  }

  if (
    (pathname === "/admin/login" ||
      pathname === "/admin/forgot-password" ||
      pathname === "/admin/reset-password" ||
      pathname === "/admin/verify-login") &&
    adminSession
  ) {
    return redirectTo(request, "/admin");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/user/:path*", "/admin/:path*"]
};
