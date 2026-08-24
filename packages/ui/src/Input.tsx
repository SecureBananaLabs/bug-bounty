import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, style, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <input
        style={{
          border: error ? "1px solid #ff4d4f" : "1px solid #d9d9d9",
          borderRadius: 6,
          padding: "0.5rem 0.75rem",
          fontSize: "0.95rem",
          outline: "none",
          ...style
        }}
        {...props}
      />
      {error && <span style={{ color: "#ff4d4f", fontSize: "0.8rem" }}>{error}</span>}
    </div>
  );
}
