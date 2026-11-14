import { AdminPanelClient } from "./AdminPanelClient";
import { adminPanelData } from "../../lib/adminMock";

export default function AdminPanelPage() {
  const session = adminPanelData.session;

  if (session.role !== "admin") {
    return (
      <section className="admin-forbidden" role="alert">
        <h2>403</h2>
        <p>Admin access required.</p>
      </section>
    );
  }

  return (
    <AdminPanelClient initialData={adminPanelData} />
  );
}
