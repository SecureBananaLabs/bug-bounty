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
] as const;

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      {links.map(([href, label]) => {
        const isCurrent = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

        return (
          <Link
            key={href}
            href={href}
            className="card"
            aria-current={isCurrent ? "page" : undefined}
            style={{
              padding: "0.5rem 0.8rem",
              borderColor: isCurrent ? "#8ea2ff" : undefined,
              background: isCurrent ? "#202b52" : undefined
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}