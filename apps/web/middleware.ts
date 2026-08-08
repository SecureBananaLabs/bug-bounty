import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const url = new URL(request.url);

  if (!url.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);
  const tokenCookie =
    request.headers.get("cookie")?.match(/(?:^|;\s*)ff_admin_token=([^;]+)/)?.[1] ??
    request.headers.get("cookie")?.match(/(?:^|;\s*)ff_admin_demo_token=([^;]+)/)?.[1];
  const bearerToken = headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!tokenCookie && !bearerToken) {
    return new NextResponse("Forbidden", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
