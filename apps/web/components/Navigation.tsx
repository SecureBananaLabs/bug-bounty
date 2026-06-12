"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveNavigationLink, navigationLinks } from "./navigation.mjs";

export function Navigation() {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Primary" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      {navigationLinks.map((link) => {
        const isActive = isActiveNavigationLink(pathname, link);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className="card"
            style={{
              padding: "0.5rem 0.8rem",
              borderColor: isActive ? "#6f8cff" : "#2a3765",
              background: isActive ? "#24315c" : "#151c35",
              boxShadow: isActive ? "0 0 0 1px rgba(111, 140, 255, 0.35)" : "none",
              fontWeight: isActive ? 600 : 400
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
