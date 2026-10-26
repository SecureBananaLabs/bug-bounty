import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const demoMode = process.env.ADMIN_PANEL_DEMO_MODE !== "false";
  const hasAdminCookie = request.cookies.get("ff_admin_role")?.value === "admin"
    || Boolean(request.cookies.get("ff_admin_token")?.value);

  if (!demoMode && !hasAdminCookie) {
    return NextResponse.redirect(new URL("/settings?error=admin_required", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
