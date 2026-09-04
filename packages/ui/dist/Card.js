import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Card({ title, children }) {
    return (_jsxs("section", { style: { border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }, children: [_jsx("h3", { children: title }), _jsx("div", { children: children })] }));
}
