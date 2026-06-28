import test from "node:test";
import assert from "node:assert/strict";
import { Button, Card } from "@freelanceflow/ui";
import { createRequire } from "node:module";

test("ESM: @freelanceflow/ui exposes Button and Card as functions", () => {
  assert.equal(typeof Button, "function");
  assert.equal(typeof Card, "function");
});

test("ESM: Button renders a <button> element with forwarded children", () => {
  const el = Button({ children: "Post job" });
  assert.equal(el.type, "button");
  assert.equal(el.props.children, "Post job");
  assert.ok(el.props.style, "Button should apply inline styles");
  assert.equal(el.props.style.background, "#5468ff");
});

test("ESM: Card renders a <section> with title and children", () => {
  const el = Card({ title: "Profile", children: "Ready" });
  assert.equal(el.type, "section");
  // Card should have h3 for title and div for children
  const [h3, div] = el.props.children;
  assert.equal(h3.type, "h3");
  assert.equal(h3.props.children, "Profile");
  assert.equal(div.type, "div");
  assert.equal(div.props.children, "Ready");
});

test("ESM: module namespace contains exactly Button and Card", async () => {
  const ns = await import("@freelanceflow/ui");
  const exportedKeys = Object.keys(ns).filter((k) => k !== "default");
  assert.deepStrictEqual(exportedKeys.sort(), ["Button", "Card"]);
});

test("CJS: require('@freelanceflow/ui') exposes Button and Card", () => {
  const require = createRequire(import.meta.url);
  const cjs = require("@freelanceflow/ui");
  assert.equal(typeof cjs.Button, "function");
  assert.equal(typeof cjs.Card, "function");

  const el = cjs.Button({ children: "Apply" });
  assert.equal(el.type, "button");
  assert.equal(el.props.children, "Apply");
});
