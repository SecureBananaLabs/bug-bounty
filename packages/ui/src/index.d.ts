import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
  ReactNode
} from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export declare function Button(props: ButtonProps): ReactElement;

export type CardProps = HTMLAttributes<HTMLElement> & {
  title: string;
  children?: ReactNode;
};

export declare function Card(props: CardProps): ReactElement;
