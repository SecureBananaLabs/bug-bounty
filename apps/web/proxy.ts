import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "ff_admin_role";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname === "/admin/forbidden") {
    return NextResponse.next();
  }

  if (request.cookies.get(ADMIN_COOKIE)?.value === "admin") {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/admin/forbidden", request.url), { status: 403 });
}

export const config = {
  matcher: ["/admin/:path*"]
};
