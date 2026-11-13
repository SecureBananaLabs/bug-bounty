import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card } from "./Card";

test("forwards native section attributes to the element", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      Card,
      {
        id: "summary",
        className: "card card--wide",
        "aria-label": "Account summary",
        lang: "en"
      },
      "Body copy"
    )
  );

  assert.ok(html.startsWith("<section"));
  assert.ok(html.includes('class="card card--wide"'));
  assert.ok(html.includes('aria-label="Account summary"'));
  assert.ok(html.includes('lang="en"'));
  assert.ok(html.includes("Body copy"));
});

test("keeps the default styling and merges a custom style on top", () => {
  const html = renderToStaticMarkup(
    React.createElement(Card, { style: { padding: "2rem" } }, "Inner")
  );

  assert.ok(html.includes("padding:2rem"));
  assert.ok(html.includes("border:1px solid #ddd"));
  assert.ok(html.includes("border-radius:8px"));
});

test("renders the title heading and omits it when absent", () => {
  const withTitle = renderToStaticMarkup(
    React.createElement(Card, { title: "Invoices" }, "List")
  );
  const withoutTitle = renderToStaticMarkup(
    React.createElement(Card, {}, "List")
  );

  assert.ok(withTitle.includes("<h3>Invoices</h3>"));
  assert.ok(!withoutTitle.includes("<h3>"));
  assert.ok(withoutTitle.includes("List"));
});
