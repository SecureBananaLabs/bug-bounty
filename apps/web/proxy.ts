import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isAdmin = request.cookies.get("ff_role")?.value === "admin";

  if (!isAdmin) {
    return new NextResponse("Admin access required", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
