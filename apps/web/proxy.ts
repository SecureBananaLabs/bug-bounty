import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const role =
    request.cookies.get("freelanceflow_role")?.value ||
    request.headers.get("x-freelanceflow-role") ||
    request.nextUrl.searchParams.get("role");

  if (role !== "admin") {
    return new NextResponse("Forbidden: admin access required", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*"
};
