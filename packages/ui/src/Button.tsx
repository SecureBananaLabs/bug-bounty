import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const defaultButtonStyle: React.CSSProperties = {
  background: "#5468ff",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "0.6rem 0.9rem",
  cursor: "pointer"
};

export function Button({ children, style, ...props }: ButtonProps) {
  return (
    <button
      style={{ ...defaultButtonStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
