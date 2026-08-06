import React from 'react';

export interface CardProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children }) => {
  return React.createElement('div', { className: 'card' }, children);
};