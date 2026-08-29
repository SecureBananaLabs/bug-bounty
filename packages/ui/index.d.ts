import type { ReactElement, ReactNode } from "react";

export interface ButtonProps {
  children: ReactNode;
}

export interface CardProps {
  title: string;
  children: ReactNode;
}

export declare function Button(props: ButtonProps): ReactElement;
export declare function Card(props: CardProps): ReactElement;
