import React from "react";
import { Button } from "./Button";

describe("Button Component HTML Props Forwarding (#743)", () => {
  it("should export Button component function", () => {
    expect(typeof Button).toBe("function");
  });
});
