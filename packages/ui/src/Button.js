const React = require("react");

function Button({ children }) {
  return React.createElement(
    "button",
    {
      style: {
        background: "#5468ff",
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "0.6rem 0.9rem",
        cursor: "pointer",
      },
    },
    children
  );
}

module.exports = { Button };
