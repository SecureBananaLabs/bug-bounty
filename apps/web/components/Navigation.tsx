"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      {links.map(([href, label]) => {
        const isCurrent = href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent ? "page" : undefined}
            className="card nav-link"
            style={{ padding: "0.5rem 0.8rem" }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
