import React from "react";

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  title?: string;
};

const baseStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "1rem"
};

export function Card({ title, children, className, style, ...rest }: CardProps) {
  return (
    <section {...rest} className={className} style={{ ...baseStyle, ...style }}>
      {title ? <h3>{title}</h3> : null}
      <div>{children}</div>
    </section>
  );
}
