const test = require("node:test");
const assert = require("node:assert/strict");

test("@freelanceflow/ui can be imported through its package entrypoint", async () => {
  const uiPackage = await import("@freelanceflow/ui");

  assert.equal(typeof uiPackage.Button, "function");
  assert.equal(typeof uiPackage.Card, "function");
});
