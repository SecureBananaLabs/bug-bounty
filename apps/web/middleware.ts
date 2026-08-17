import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function isAdminToken(token: string) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return false;
  try {
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    if (claims.role !== "ADMIN" || (claims.exp && claims.exp * 1000 <= Date.now())) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(process.env.JWT_SECRET ?? "development-secret"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    return crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), new TextEncoder().encode(`${header}.${payload}`));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  const adminToken = request.cookies.get("adminToken")?.value;
  if (!adminToken || !(await isAdminToken(adminToken))) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "403");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
