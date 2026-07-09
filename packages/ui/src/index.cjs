const React = require("react");

const buttonStyle = {
  background: "#5468ff",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "0.6rem 0.9rem",
  cursor: "pointer"
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "1rem"
};

function Button({ children, type = "button", style, ...props }) {
  return React.createElement(
    "button",
    {
      type,
      ...props,
      style: { ...buttonStyle, ...style }
    },
    children
  );
}

function Card({ title, children, style, ...props }) {
  return React.createElement(
    "section",
    { ...props, style: { ...cardStyle, ...style } },
    React.createElement("h3", null, title),
    React.createElement("div", null, children)
  );
}

module.exports = {
  Button,
  Card
};
