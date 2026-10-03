import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

const defaultButtonStyle: CSSProperties = {
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
      {...props}
      style={{
        ...defaultButtonStyle,
        ...style
      }}
    >
      {children}
    </button>
  );
}
