"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const jsx_runtime_1 = require("react/jsx-runtime");
function Button({ children }) {
    return ((0, jsx_runtime_1.jsx)("button", { style: {
            background: "#5468ff",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "0.6rem 0.9rem",
            cursor: "pointer"
        }, children: children }));
}
