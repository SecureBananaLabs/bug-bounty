import React from "react";

type CardProps = React.ComponentPropsWithoutRef<"section"> & {
  title: string;
  children: React.ReactNode;
};

export function Card({ title, children, style, ...rest }: CardProps) {
  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", ...style }} {...rest}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
