import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const role = request.cookies.get("freelanceflow_role")?.value;

  if (request.nextUrl.pathname.startsWith("/admin") && role && role !== "admin") {
    return NextResponse.rewrite(new URL("/admin/forbidden", request.url), { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
