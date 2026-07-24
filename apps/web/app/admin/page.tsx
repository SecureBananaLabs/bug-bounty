import { forbidden } from "next/navigation";
import AdminPanelClient from "./AdminPanelClient";
import { getAdminSnapshot } from "./adminData";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPanelPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;

  if (firstParam(params.role) !== "admin") {
    forbidden();
  }

  return <AdminPanelClient initialSnapshot={getAdminSnapshot()} />;
}
