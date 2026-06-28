import React from "react";

export function Card({ title, children }) {
  return React.createElement(
    "div",
    null,
    React.createElement("h3", null, title),
    children
  );
}
