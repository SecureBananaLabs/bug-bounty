import Link from "next/link";

type UserRole = "client" | "freelancer" | "admin";

const links = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/freelancers/search", label: "Find Freelancers" },
  { href: "/dashboard/client", label: "Client Dashboard" },
  { href: "/dashboard/freelancer", label: "Freelancer Dashboard" },
  { href: "/messaging", label: "Messaging" },
  { href: "/admin", label: "Admin", requiredRole: "admin" }
] as const;

export function Navigation({ userRole = "client" }: { userRole?: UserRole } = {}) {
  const visibleLinks = links.filter((link) => !("requiredRole" in link) || link.requiredRole === userRole);

  return (
    <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      {visibleLinks.map(({ href, label }) => (
        <Link key={href} href={href} className="card" style={{ padding: "0.5rem 0.8rem" }}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
