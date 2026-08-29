import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export function Button({ children, style, ...props }: ButtonProps) {
  const defaultStyle: React.CSSProperties = {
    background: "#5468ff",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "0.6rem 0.9rem",
    cursor: "pointer",
  };

  return (
    <button
      style={{ ...defaultStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
