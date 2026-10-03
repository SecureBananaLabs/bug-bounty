import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ children, style, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      style={{
        background: "#5468ff",
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "0.6rem 0.9rem",
        cursor: "pointer",
        ...style
      }}
    >
      {children}
    </button>
  );
}
