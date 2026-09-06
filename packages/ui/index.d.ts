import type { ReactNode } from "react";

export interface ButtonProps {
  children?: ReactNode;
}

export declare function Button(props: ButtonProps): ReactNode;

export interface CardProps {
  title: string;
  children?: ReactNode;
}

export declare function Card(props: CardProps): ReactNode;
