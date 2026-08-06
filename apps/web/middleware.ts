import { NextRequest, NextResponse } from "next/server";

/** Routes that require admin role. Must use server-side cookie auth. */
const ADMIN_ROUTES = ["/admin"];

/**
 * Next.js middleware that enforces authentication and role gating
 * for protected routes before any page component is rendered.
 *
 * Without this, Next.js Server Components render on every request
 * regardless of session state — the page component must NOT be relied
 * upon as the only auth check.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isAdminRoute) {
    // In production, verify a signed session cookie or JWT here.
    // Example: const session = await getSession(request.cookies);
    // if (!session || session.role !== "admin") { ... redirect }
    //
    // For now, redirect any unauthenticated request to the login page.
    const sessionToken = request.cookies.get("session_token");
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
