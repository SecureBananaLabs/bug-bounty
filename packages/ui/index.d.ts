import type { ReactElement, ReactNode } from "react";

export function Button({ children }: { children: ReactNode }): ReactElement;

export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement;
