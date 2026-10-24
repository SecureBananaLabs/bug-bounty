import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Input } from "./Input";

test("forwards native input attributes to the element", () => {
  const html = renderToStaticMarkup(
    React.createElement(Input, {
      id: "email",
      name: "email",
      type: "email",
      placeholder: "you@example.com",
      disabled: true,
      "aria-label": "Email address",
      defaultValue: "hello"
    })
  );

  assert.ok(html.includes('type="email"'));
  assert.ok(html.includes('placeholder="you@example.com"'));
  assert.ok(html.includes('aria-label="Email address"'));
  assert.ok(html.includes('disabled=""'));
  assert.ok(html.includes("hello"));
});

test("renders a label and no error markup when there is no error", () => {
  const html = renderToStaticMarkup(
    React.createElement(Input, { label: "Company", id: "company" })
  );

  assert.ok(html.includes("Company"));
  assert.ok(!html.includes('role="alert"'));
});

test("shows an inline error and links it to the input", () => {
  const html = renderToStaticMarkup(
    React.createElement(Input, { id: "budget", error: "Budget is required" })
  );

  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes("Budget is required"));
  assert.ok(html.includes('aria-invalid="true"'));
  assert.ok(html.includes('aria-describedby="budget-error"'));
});
