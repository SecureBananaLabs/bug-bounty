import test from "node:test";
import assert from "node:assert/strict";

test("@freelanceflow/ui exposes runtime component exports", async () => {
  const ui = await import("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
});
