import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  title?: React.ReactNode;
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLSectionElement, CardProps>(
  ({ title, children, className, style, ...props }, ref) => {
    const defaultStyle: React.CSSProperties = {
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      ...style,
    };

    return (
      <section
        ref={ref}
        className={className}
        style={defaultStyle}
        {...props}
      >
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
        {children}
      </section>
    );
  }
);

Card.displayName = 'Card';