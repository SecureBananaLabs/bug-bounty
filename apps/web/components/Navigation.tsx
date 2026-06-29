import Link from "next/link";
import { navigationLinks } from "./navigationLinks.mjs";

export function Navigation() {
  return (
    <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      {navigationLinks.map(({ href, label }) => (
        <Link key={href} href={href} className="card" style={{ padding: "0.5rem 0.8rem" }}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
