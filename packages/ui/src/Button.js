import React from "react";

export function Button({ children, style, ...props }) {
  const defaultStyle = {
    background: "#5468ff",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "0.6rem 0.9rem",
    cursor: "pointer",
  };

  return React.createElement(
    "button",
    {
      style: { ...defaultStyle, ...style },
      ...props,
    },
    children
  );
}
