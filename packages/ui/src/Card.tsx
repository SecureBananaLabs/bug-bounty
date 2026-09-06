import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  children: React.ReactNode;
}

export function Card({ title, children, className = '', style, ...rest }: CardProps) {
  const defaultClassName = `border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900 ${className}`.trim();

  return (
    <section className={defaultClassName} style={style} {...rest}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {children}
    </section>
  );
}

export default Card;
