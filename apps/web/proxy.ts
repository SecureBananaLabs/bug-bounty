import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const role = request.cookies.get("ff_role")?.value ?? request.headers.get("x-user-role");
  if (role !== "admin") {
    return NextResponse.rewrite(new URL("/forbidden", request.url), { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
