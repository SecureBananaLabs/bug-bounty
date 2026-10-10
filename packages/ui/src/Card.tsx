import React from "react";

export function Card({ title, children, style, ...sectionProps }: React.HTMLAttributes<HTMLElement> & { title: string }) {
  return (
    <section
      {...sectionProps}
      style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", ...style }}
    >
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
