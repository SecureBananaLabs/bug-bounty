import type { ReactElement, ReactNode } from "react";

export interface ButtonProps {
  children: ReactNode;
}

export declare function Button({ children }: ButtonProps): ReactElement;

export interface CardProps {
  title: string;
  children: ReactNode;
}

export declare function Card({ title, children }: CardProps): ReactElement;
