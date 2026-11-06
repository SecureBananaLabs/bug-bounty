import React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, type = "text", ...rest }: InputProps) {
  const describedBy = error ? `${rest.id ?? "input"}-error` : undefined;

  return (
    <label style={{ display: "block" }}>
      {label ? <span>{label}</span> : null}
      <input
        {...rest}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        style={{ border: "1px solid #cbd5f5", borderRadius: 8, padding: "0.5rem 0.7rem" }}
      />
      {error ? (
        <span role="alert" id={describedBy} style={{ color: "#b42318" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
