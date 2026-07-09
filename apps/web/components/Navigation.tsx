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
    <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      {links.map(([href, label]) => {
        const isActive = pathname === href;
        return (
          <Link 
            key={href} 
            href={href} 
            className="card" 
            style={{ padding: "0.5rem 0.8rem", ...(isActive ? { fontWeight: "bold", border: "1px solid currentColor" } : {}) }}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
