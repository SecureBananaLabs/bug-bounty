import Link from "next/link";

const links = [
  ["/", "Home"],
  ["/jobs", "Jobs"],
  ["/freelancers/search", "Find Freelancers"],
  ["/dashboard/client", "Client Dashboard"],
  ["/dashboard/freelancer", "Freelancer Dashboard"],
  ["/messaging", "Messaging"],
  ["/billing", "Billing"],
  ["/admin", "Admin"],
];

export function Navigation() {
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="nav-link">
          {label}
        </Link>
      ))}
    </nav>
  );
}
