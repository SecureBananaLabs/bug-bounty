import type { ReactNode } from "react";

export interface ButtonProps {
  children: ReactNode;
}

export declare function Button(props: ButtonProps): JSX.Element;

export interface CardProps {
  title: string;
  children: ReactNode;
}

export declare function Card(props: CardProps): JSX.Element;
