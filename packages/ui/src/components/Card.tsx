import React from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, elevated, ...props }) => {
  return (
    <div
      className={cn(
        'rounded border bg-white p-6',
        elevated && 'shadow-md',
        className
      )}
      {...props}
    />
  );
};