import React from "react";
export const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return <button className="btn" {...props}>{children}</button>;
};
