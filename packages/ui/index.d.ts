import type { ReactNode } from "react";

export function Button({ children }: { children: ReactNode }): ReactNode;

export function Card({ title, children }: { title: string; children: ReactNode }): ReactNode;
