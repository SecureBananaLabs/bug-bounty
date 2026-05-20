import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import AdminDashboardClient from "./AdminDashboardClient";
import { loadAdminDashboard } from "../../lib/admin-data";

const jwtSecret = process.env.JWT_SECRET ?? "development-secret";

async function getToken(searchParams: Record<string, string | string[] | undefined>) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("ff_access_token")?.value;
  const queryToken = typeof searchParams.token === "string" ? searchParams.token : undefined;
  return cookieToken ?? queryToken ?? null;
}

function verifyAdminToken(token: string | null) {
  if (!token) {
    return { ok: false, reason: "No admin token provided" };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { role?: string; sub?: string };
    if (decoded.role !== "admin") {
      return { ok: false, reason: "Admin role required" };
    }

    return { ok: true, subject: decoded.sub ?? "admin" };
  } catch {
    return { ok: false, reason: "Invalid or expired token" };
  }
}

export default async function AdminPanelPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const token = await getToken(searchParams ?? {});
  const access = verifyAdminToken(token);
  const state = typeof searchParams?.state === "string" ? searchParams.state : "ready";

  if (!access.ok) {
    return (
      <section className="card">
        <h2>403</h2>
        <p>
          Admin access required. Provide a valid admin JWT via the <code>ff_access_token</code> cookie or <code>?token=</code>{" "}
          query param for preview.
        </p>
        <p className="muted">{access.reason}</p>
      </section>
    );
  }

  const dashboard = await loadAdminDashboard({ token });

  return <AdminDashboardClient token={token} initialData={dashboard} previewState={state} />;
}
