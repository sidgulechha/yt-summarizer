import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "better-auth.session_token";
const AUTH_ROUTES = ["/auth"];
const PROTECTED_ROUTES = ["/", "/history"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Authenticated user hitting /auth → send to home
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unauthenticated user hitting a protected page → send to /auth
  if (PROTECTED_ROUTES.includes(pathname) && !hasSession) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Skip static files, _next internals, and the Better Auth API.
     * Match every page route that needs protection.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
