import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  title: string;
  children: ReactNode;
};

const defaultCardStyle: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "1rem"
};

export function Card({ title, children, style, ...props }: CardProps) {
  return (
    <section
      {...props}
      style={{
        ...defaultCardStyle,
        ...style
      }}
    >
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
