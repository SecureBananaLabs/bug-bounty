import Link from "next/link";

type UserRole = "admin" | "client" | "freelancer";

const publicLinks = [
  ["/", "Home"],
  ["/jobs", "Jobs"],
  ["/freelancers/search", "Find Freelancers"],
  ["/dashboard/client", "Client Dashboard"],
  ["/dashboard/freelancer", "Freelancer Dashboard"],
  ["/messaging", "Messaging"]
];

export function Navigation({ currentUserRole }: { currentUserRole?: UserRole }) {
  const links = currentUserRole === "admin" ? [...publicLinks, ["/admin", "Admin"]] : publicLinks;

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
