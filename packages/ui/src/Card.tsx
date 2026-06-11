import React from "react";

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export default Card;
}
