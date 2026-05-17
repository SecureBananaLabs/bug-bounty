import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const backendApiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyAdminRequest(request: NextRequest, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get("ff_access_token")?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  const target = new URL(`${backendApiBase}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  const response = await fetch(target, {
    body,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": request.headers.get("content-type") ?? "application/json"
    },
    method
  });

  const payload = await response.text();

  return new NextResponse(payload, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json"
    }
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyAdminRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyAdminRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyAdminRequest(request, context);
}
