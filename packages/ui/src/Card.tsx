import React from "react";

export function Card({
  title,
  children,
  ...props
}: { title: string; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }} {...props}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
