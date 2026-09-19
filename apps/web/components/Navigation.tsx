import Link from "next/link";

const links = [
  ["/", "Home"],
  ["/jobs", "Jobs"],
  ["/freelancers/search", "Find Freelancers"],
  ["/dashboard/client", "Client Dashboard"],
  ["/dashboard/freelancer", "Freelancer Dashboard"],
  ["/messaging", "Messaging"],
  ["/admin", "Admin"]
];

export function Navigation() {
  return (
    <nav aria-label="Primary navigation">
      <ul
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          listStyle: "none",
          margin: "0 0 20px",
          padding: 0
        }}
      >
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="card" style={{ padding: "0.5rem 0.8rem" }}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
