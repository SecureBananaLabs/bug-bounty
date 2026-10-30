import Link from "next/link";

type NavigationProps = {
  currentUserRole?: string;
};

type NavigationLink = readonly [href: string, label: string];

const publicLinks: NavigationLink[] = [
  ["/", "Home"],
  ["/jobs", "Jobs"],
  ["/freelancers/search", "Find Freelancers"],
  ["/dashboard/client", "Client Dashboard"],
  ["/dashboard/freelancer", "Freelancer Dashboard"],
  ["/messaging", "Messaging"]
];

const adminLink: NavigationLink = ["/admin", "Admin"];

export function Navigation({ currentUserRole }: NavigationProps) {
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
