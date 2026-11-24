import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminPanel } from "../../components/AdminPanel";
import { adminSnapshot } from "../../lib/adminMock";

export const dynamic = "force-dynamic";

async function requireAdminSession() {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const role =
    headerStore.get("x-admin-role") ??
    cookieStore.get("ff_role")?.value ??
    process.env.ADMIN_PANEL_ROLE ??
    "admin";

  if (role !== "admin") {
    redirect("/admin/forbidden");
  }

  return {
    adminId:
      headerStore.get("x-admin-id") ??
      cookieStore.get("ff_admin_id")?.value ??
      process.env.ADMIN_PANEL_ADMIN_ID ??
      adminSnapshot.session.adminId
  };
}

export default async function AdminPanelPage() {
  const session = await requireAdminSession();

  return <AdminPanel initialState={{ ...adminSnapshot, session }} />;
}
