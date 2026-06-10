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
}

const Card: React.FC<CardProps> = ({ children }) => {
  return <div className="card">{children}</div>;
};

export default Card;
}
