import React from "react";

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
}

export function Card({ children, title }: CardProps) {
  return (
    <div className="card">
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">{children}</div>
    </div>
  );
}

export default Card;
}
