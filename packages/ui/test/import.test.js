const test = require("node:test");
const assert = require("node:assert/strict");

test("@freelanceflow/ui resolves through the workspace package name for ESM consumers", async () => {
  const ui = await import("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
});

test("@freelanceflow/ui resolves through the workspace package name for CommonJS consumers", () => {
  const ui = require("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
});
