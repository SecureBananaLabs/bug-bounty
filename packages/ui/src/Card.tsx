import React from "react";

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  title: string;
};

const defaultCardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "1rem"
};

export function Card({ title, children, style, ...props }: CardProps) {
  return (
    <section style={{ ...defaultCardStyle, ...style }} {...props}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
