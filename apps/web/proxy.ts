import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/forbidden") {
    return NextResponse.next();
  }

  const role = request.cookies.get("ff_role")?.value ?? request.headers.get("x-user-role");
  if (role !== "admin") {
    return NextResponse.redirect(new URL("/admin/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
