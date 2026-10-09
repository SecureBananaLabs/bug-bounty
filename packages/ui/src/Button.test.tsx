import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./Button";

test("forwards native button attributes to the element", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      Button,
      {
        id: "save",
        name: "save",
        type: "submit",
        disabled: true,
        "aria-label": "Save changes"
      },
      "Save"
    )
  );

  assert.ok(html.includes('type="submit"'));
  assert.ok(html.includes('aria-label="Save changes"'));
  assert.ok(html.includes('disabled=""'));
  assert.ok(html.includes("Save"));
});

test("keeps the default styling and merges a custom style on top", () => {
  const html = renderToStaticMarkup(
    React.createElement(Button, { style: { background: "red" } }, "Go")
  );

  assert.ok(html.includes("background:red"));
  assert.ok(html.includes("border-radius:8px"));
  assert.ok(html.includes("cursor:pointer"));
});

test("lets a caller override the default type", () => {
  const html = renderToStaticMarkup(
    React.createElement(Button, { type: "button" }, "Cancel")
  );

  assert.ok(html.includes('type="button"'));
  assert.ok(!html.includes('type="submit"'));
});
