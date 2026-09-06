import assert from "node:assert/strict";
import { test } from "node:test";

test("@freelanceflow/ui can be imported through the workspace package name", async () => {
  const ui = await import("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
});
