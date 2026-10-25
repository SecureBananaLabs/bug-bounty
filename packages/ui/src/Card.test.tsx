import React from "react";
import { Card } from "./Card";

describe("Card Component HTML Props Forwarding (#11715)", () => {
  it("should export Card component function", () => {
    expect(typeof Card).toBe("function");
  });

  it("should forward section props including className and aria attributes", () => {
    const element = Card({
      title: "Test Card",
      children: "Card Content",
      className: "custom-card",
      "aria-label": "Card Section",
    });

    expect(element.type).toBe("section");
    expect(element.props.title).toBeUndefined();
    expect(element.props.className).toBe("custom-card");
    expect(element.props["aria-label"]).toBe("Card Section");
  });
});
