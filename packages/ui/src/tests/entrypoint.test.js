const test = require("node:test");
const assert = require("node:assert/strict");

test("@freelanceflow/ui exposes a runtime package entrypoint", () => {
  const ui = require("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
  assert.equal(ui.Button({ children: "Save" }).type, "button");
  assert.equal(ui.Card({ title: "Project", children: "Details" }).type, "section");
});
