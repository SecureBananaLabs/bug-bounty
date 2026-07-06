import React from "react";

type CardProps = React.HTMLAttributes<HTMLElement> & {
  title: string;
  children: React.ReactNode;
};

const defaultCardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "1rem"
};

export function Card({ title, children, style, ...sectionProps }: CardProps) {
  return (
    <section {...sectionProps} style={{ ...defaultCardStyle, ...style }}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
