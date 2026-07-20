import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const role = request.cookies.get("freelanceflow_role")?.value?.toLowerCase();

  if (role !== "admin") {
    const forbiddenUrl = new URL("/settings", request.url);
    forbiddenUrl.searchParams.set("error", "403");
    forbiddenUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
