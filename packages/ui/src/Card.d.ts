import type { ReactNode } from "react";

export interface CardProps {
  title: string;
  children: ReactNode;
}

export declare function Card(props: CardProps): JSX.Element;
