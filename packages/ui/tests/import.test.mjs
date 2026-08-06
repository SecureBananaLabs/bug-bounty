import test from "node:test";
import assert from "node:assert/strict";

test("@freelanceflow/ui is importable through its workspace package name", async () => {
  const ui = await import("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
});
