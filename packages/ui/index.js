const React = require("react");

function Button({ children, ...props }) {
  return React.createElement(
    "button",
    {
      ...props,
      style: {
        background: "#5468ff",
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "0.6rem 0.9rem",
        cursor: "pointer",
        ...props.style
      }
    },
    children
  );
}

function Card({ title, children, ...props }) {
  return React.createElement(
    "section",
    {
      ...props,
      style: {
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "1rem",
        ...props.style
      }
    },
    React.createElement("h3", null, title),
    React.createElement("div", null, children)
  );
}

module.exports = { Button, Card };
