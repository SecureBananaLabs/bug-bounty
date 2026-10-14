import React from "react";

export function Button({ children }) {
  return React.createElement(
    "button",
    {
      style: {
        background: "#111827",
        color: "white",
        border: "none",
        borderRadius: 9999,
        padding: "0.65rem 1rem"
      }
    },
    children
  );
}
