import React from "react";

const buttonStyle = {
  background: "#5468ff",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "0.6rem 0.9rem",
  cursor: "pointer"
};

export function Button({ children }) {
  return React.createElement("button", { style: buttonStyle }, children);
}

export function Card({ title, children }) {
  return React.createElement(
    "section",
    { style: { border: "1px solid #ddd", borderRadius: 8, padding: "1rem" } },
    React.createElement("h3", null, title),
    React.createElement("div", null, children)
  );
}
