import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { forbidden } from "next/navigation";
import { AdminPanelClient } from "./AdminPanelClient";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueOfParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function hasVerifiedAdminToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) {
    return false;
  }

  try {
    const decodedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    if (decodedHeader.alg !== "HS256") {
      return false;
    }

    const secret = process.env.JWT_SECRET ?? "development-secret";
    const expectedSignature = createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (!safeEqual(signature, expectedSignature)) {
      return false;
    }

    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const isExpired = decodedPayload.exp && decodedPayload.exp * 1000 <= Date.now();
    return !isExpired && String(decodedPayload.role ?? "").toLowerCase() === "admin";
  } catch {
    return false;
  }
}

export default async function AdminPanelPage({ searchParams }: AdminPageProps) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const headerStore = await headers();
  const demoModeEnabled = process.env.NEXT_PUBLIC_ADMIN_DEMO_MODE === "true";
  const requestedDemoAccess = demoModeEnabled && valueOfParam(params.admin) === "true";
  const cookieToken = cookieStore.get("freelanceflow_access_token")?.value;
  const bearerToken = headerStore.get("authorization")?.replace(/^Bearer\s+/i, "");
  const hasAdminToken = hasVerifiedAdminToken(cookieToken) || hasVerifiedAdminToken(bearerToken);

  if (!requestedDemoAccess && !hasAdminToken) {
    forbidden();
  }

  return <AdminPanelClient />;
}
