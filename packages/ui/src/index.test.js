const test = require("node:test");
const assert = require("node:assert/strict");

test("@freelanceflow/ui resolves through the workspace package name", async () => {
  const uiPackage = await import("@freelanceflow/ui");

  assert.equal(typeof uiPackage.Button, "function");
  assert.equal(typeof uiPackage.Card, "function");
});
