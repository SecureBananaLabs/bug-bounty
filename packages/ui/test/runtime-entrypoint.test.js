const assert = require("node:assert/strict");
const test = require("node:test");

test("runtime entrypoint exposes UI components", async () => {
  const ui = await import("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
});
