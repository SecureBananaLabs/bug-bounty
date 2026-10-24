import { cookies } from "next/headers";
import { AdminPanelClient } from "./AdminPanelClient";

export const dynamic = "force-dynamic";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function Forbidden() {
  return (
    <section className="admin-shell" aria-labelledby="admin-denied-title">
      <div className="admin-status admin-status-error">
        <strong id="admin-denied-title">403 admin access required</strong>
        <span>Sign in with an administrator account before opening the operations panel.</span>
      </div>
    </section>
  );
}

export default async function AdminPanelPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("ff_role")?.value?.toUpperCase();
  const token = cookieStore.get("ff_access_token")?.value;

  if (role !== "ADMIN" || !token) {
    return <Forbidden />;
  }

  const response = await fetch(`${apiBaseUrl}/admin/metrics`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch(() => null);

  if (!response?.ok) {
    return <Forbidden />;
  }

  return <AdminPanelClient apiBaseUrl="/admin/api" />;
}
