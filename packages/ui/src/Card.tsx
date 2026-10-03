import * as React from 'react';

const defaultCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 16,
};

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Optional heading rendered at the top of the card. */
  title?: string;
}

export function Card({ title, children, style, ...sectionProps }: CardProps) {
  return (
    <section {...sectionProps} style={{ ...defaultCardStyle, ...style }}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export default Card;
