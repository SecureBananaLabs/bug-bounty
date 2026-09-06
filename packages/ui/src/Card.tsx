import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div>{children}</div>
    </div>
  );
};
