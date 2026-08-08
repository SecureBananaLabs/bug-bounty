import { adminDashboardData } from "../../lib/adminMock";
import { AdminPanelClient } from "./AdminPanelClient";

export default function AdminPanelPage() {
  return <AdminPanelClient initialData={adminDashboardData} />;
}
