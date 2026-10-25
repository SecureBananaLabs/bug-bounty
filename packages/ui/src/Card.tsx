import type { ReactNode } from "react";

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
