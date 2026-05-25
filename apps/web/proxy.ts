import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/admin") {
    return NextResponse.next();
  }

  if (request.cookies.get("ff_role")?.value === "admin") {
    return NextResponse.next();
  }

  const forbiddenUrl = request.nextUrl.clone();
  forbiddenUrl.pathname = "/admin/forbidden";
  forbiddenUrl.searchParams.set("status", "403");
  return NextResponse.rewrite(forbiddenUrl, { status: 403 });
}

export const config = {
  matcher: ["/admin"]
};
