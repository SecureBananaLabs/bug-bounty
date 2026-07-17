import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("ui package is directly importable by workspace consumers", async () => {
  const ui = await import("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");

  const buttonHtml = renderToStaticMarkup(
    React.createElement(ui.Button, null, "Hire now")
  );
  const cardHtml = renderToStaticMarkup(
    React.createElement(ui.Card, { title: "Profile" }, "Available")
  );

  assert.match(buttonHtml, /Hire now/);
  assert.match(cardHtml, /Profile/);
  assert.match(cardHtml, /Available/);
});
