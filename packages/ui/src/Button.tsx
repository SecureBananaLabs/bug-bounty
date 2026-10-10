import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const defaultStyle: React.CSSProperties = {
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
      style={{ ...defaultStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
