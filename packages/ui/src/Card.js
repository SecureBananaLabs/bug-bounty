const React = require("react");

function Card({ title, children }) {
  return React.createElement(
    "section",
    { style: { border: "1px solid #ddd", borderRadius: 8, padding: "1rem" } },
    React.createElement("h3", null, title),
    React.createElement("div", null, children)
  );
}

exports.Card = Card;
