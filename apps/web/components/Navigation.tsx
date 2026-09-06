import Link from "next/link";

/** Links visible to all authenticated users */
const publicLinks: [string, string][] = [
  ["/", "Home"],
  ["/jobs", "Jobs"],
  ["/freelancers/search", "Find Freelancers"],
  ["/dashboard/client", "Client Dashboard"],
  ["/dashboard/freelancer", "Freelancer Dashboard"],
  ["/messaging", "Messaging"]
];

// NOTE: The /admin route must be rendered only after server-side role
// verification. Do NOT add it here — it would be surfaced to every
// visitor, making admin functionality discoverable without auth.

export function Navigation() {
  return (
    <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      {publicLinks.map(([href, label]) => (
        <Link key={href} href={href} className="card" style={{ padding: "0.5rem 0.8rem" }}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
