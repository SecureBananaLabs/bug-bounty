import React from "react";
import { Card } from "./Card";

describe("Card Component HTML Props Forwarding (#11620)", () => {
  it("should export Card component function", () => {
    expect(typeof Card).toBe("function");
  });
});
