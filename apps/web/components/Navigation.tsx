import Link from "next/link";

const publicLinks = [
  ["/", "Home"],
  ["/jobs", "Jobs"],
  ["/freelancers/search", "Find Freelancers"],
  ["/dashboard/client", "Client Dashboard"],
  ["/dashboard/freelancer", "Freelancer Dashboard"],
  ["/messaging", "Messaging"]
];

const adminLink = ["/admin", "Admin"];

type NavigationProps = {
  role?: "admin" | "client" | "freelancer";
};

export function Navigation({ role }: NavigationProps) {
  const links = role === "admin" ? [...publicLinks, adminLink] : publicLinks;

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
