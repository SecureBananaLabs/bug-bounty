import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const role = request.cookies.get("ff_role")?.value?.toUpperCase();
  const token = request.cookies.get("ff_access_token")?.value;

  if (role !== "ADMIN" || !token) {
    return new NextResponse(
      "<!doctype html><title>403 admin access required</title><main style=\"align-items:center;background:#0b1020;color:#f8fafc;display:flex;font-family:Inter,Arial,sans-serif;min-height:100vh;justify-content:center;margin:0;padding:2rem\"><section style=\"background:#111827;border:1px solid #be123c;border-radius:8px;max-width:520px;padding:1.25rem\"><h1 style=\"font-size:1.5rem;margin:0 0 .5rem\">403 admin access required</h1><p style=\"color:#cbd5e1;margin:0\">Sign in with an administrator account before opening the operations panel.</p></section></main>",
      {
        status: 403,
        headers: {
          "content-type": "text/html; charset=utf-8"
        }
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*"
};
