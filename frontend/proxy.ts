import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gate the admin area: if there is no session cookie, bounce unauthenticated
// visitors to the login page instead of rendering the admin shell. This is a
// presence check only — the backend remains the authority and validates the
// JWT on every /admin/* API call. The cookie is HttpOnly, so it is readable
// here (server-side) but not from client JS.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has("admin_session");
  if (!hasSession) {
    const loginURL = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginURL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
