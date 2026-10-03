import React from "react";

type CardProps = React.ComponentPropsWithoutRef<"section"> & {
  title: string;
};

export function Card({ title, children, style, ...sectionProps }: CardProps) {
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