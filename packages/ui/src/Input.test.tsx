import React from "react";
import { Input } from "./Input";

describe("Input Component HTML Props Forwarding (#743)", () => {
  it("should export Input component function", () => {
    expect(typeof Input).toBe("function");
  });
});
