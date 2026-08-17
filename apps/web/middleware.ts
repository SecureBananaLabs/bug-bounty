import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get("adminToken")?.value;
  const response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!adminToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
