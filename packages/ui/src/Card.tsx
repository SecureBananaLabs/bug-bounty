import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children, style, ...props }: CardProps) {
  return (
    <section
      style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", ...style }}
      {...props}
    >
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
