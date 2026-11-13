import React from "react";

type CardProps = React.HTMLAttributes<HTMLElement> & {
  title: string;
  children: React.ReactNode;
};

export function Card({ title, children, style, ...props }: CardProps) {
  return (
    <section
      {...props}
      style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", ...style }}
    >
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
