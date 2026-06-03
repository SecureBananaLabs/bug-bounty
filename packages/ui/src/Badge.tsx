import React from "react";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "default", children }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};
