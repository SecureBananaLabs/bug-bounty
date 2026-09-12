import Link from "next/link";

const links = [
  ["/", "Home"],
  ["/jobs", "Jobs"],
  ["/freelancers/search", "Find Freelancers"],
  ["/billing", "Billing"],
  ["/messaging", "Messaging"],
  ["/notifications", "Notifications"],
  ["/settings", "Settings"],
  ["/admin", "Admin"]
];

export function Navigation() {
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
