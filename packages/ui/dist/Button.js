import { jsx as _jsx } from "react/jsx-runtime";
export function Button({ children }) {
    return (_jsx("button", { style: {
            background: "#5468ff",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "0.6rem 0.9rem",
            cursor: "pointer"
        }, children: children }));
}
