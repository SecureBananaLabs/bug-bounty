import React from "react";

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  children: React.ReactNode;
};

export function Button({ children, style, ...rest }: ButtonProps) {
  return (
    <button
      style={{
        background: "#5468ff",
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "0.6rem 0.9rem",
        cursor: "pointer",
        ...style
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
