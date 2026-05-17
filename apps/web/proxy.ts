import { NextRequest, NextResponse } from "next/server";

function readJwtRole(token?: string) {
  if (!token) return "";
  const payload = token.split(".")[1];
  if (!payload) return "";

  try {
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(atob(padded)).role ?? "";
  } catch {
    return "";
  }
}

export function proxy(request: NextRequest) {
  const roleCookie = request.cookies.get("ff_role")?.value;
  const token = request.cookies.get("ff_access_token")?.value;
  const role = roleCookie || readJwtRole(token);

  if (role === "admin") {
    return NextResponse.next();
  }

  const forbiddenUrl = new URL("/settings", request.url);
  forbiddenUrl.searchParams.set("error", "403");
  return NextResponse.redirect(forbiddenUrl);
}

export const config = {
  matcher: ["/admin/:path*"]
};
