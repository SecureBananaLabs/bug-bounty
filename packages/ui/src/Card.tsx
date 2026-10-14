import React from "react";

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid #2a3765", borderRadius: 8, padding: "1rem", background: "#151c35", color: "#f2f5ff" }}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
