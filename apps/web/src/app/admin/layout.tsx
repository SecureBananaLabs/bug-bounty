import { ReactNode } from "react";

export const metadata = {
  title: "Admin Panel - FreelanceFlow",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
