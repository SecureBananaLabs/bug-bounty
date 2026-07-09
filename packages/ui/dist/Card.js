"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
const jsx_runtime_1 = require("react/jsx-runtime");
function Card({ title, children }) {
    return ((0, jsx_runtime_1.jsxs)("section", { style: { border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }, children: [(0, jsx_runtime_1.jsx)("h3", { children: title }), (0, jsx_runtime_1.jsx)("div", { children: children })] }));
}
