import Link from "next/link";

type UserRole = "client" | "freelancer" | "admin";

const publicLinks = [
  ["/", "Home"],
  ["/jobs", "Jobs"],
  ["/freelancers/search", "Find Freelancers"],
  ["/dashboard/client", "Client Dashboard"],
  ["/dashboard/freelancer", "Freelancer Dashboard"],
  ["/messaging", "Messaging"]
] as const;

const adminLink = ["/admin", "Admin"] as const;

export function Navigation({ currentUserRole }: { currentUserRole?: UserRole }) {
  const links = currentUserRole === "admin" ? [...publicLinks, adminLink] : publicLinks;

  return (
    <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="card" style={{ padding: "0.5rem 0.8rem" }}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
