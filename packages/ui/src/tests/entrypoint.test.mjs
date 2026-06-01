import test from "node:test";
import assert from "node:assert/strict";

test("@freelanceflow/ui exposes its public components from the package entrypoint", async () => {
  const ui = await import("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
});
