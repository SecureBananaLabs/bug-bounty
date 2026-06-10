import React from "react";

export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        background: "#5468ff",
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "0.6rem 0.9rem",
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  );
export default function Button() { return null; }
}
