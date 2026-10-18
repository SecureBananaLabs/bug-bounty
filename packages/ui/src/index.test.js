import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

test("@freelanceflow/ui exposes runtime component exports", async () => {
  const ui = await import("@freelanceflow/ui");
  const require = createRequire(import.meta.url);
  const cjs = require("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
  assert.equal(typeof cjs.Button, "function");
  assert.equal(typeof cjs.Card, "function");

  const onClick = () => {};
  const button = ui.Button({ children: "Save", onClick, disabled: true });
  assert.equal(button.props.type, "button");
  assert.equal(button.props.onClick, onClick);
  assert.equal(button.props.disabled, true);

  const card = ui.Card({ title: "Profile", children: "Ready", className: "panel" });
  assert.equal(card.props.className, "panel");
});
