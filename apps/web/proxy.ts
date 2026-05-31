import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/forbidden") {
    return NextResponse.next();
  }

  const role = request.cookies.get("freelanceflow_role")?.value;
  if (role !== "admin") {
    const forbiddenUrl = request.nextUrl.clone();
    forbiddenUrl.pathname = "/admin/forbidden";
    return NextResponse.rewrite(forbiddenUrl, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
