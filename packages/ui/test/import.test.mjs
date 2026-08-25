import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("packages/ui is importable by workspace name", async () => {
  const mod = await import("@freelanceflow/ui");

  assert.equal(typeof mod.Button, "function");
  assert.equal(typeof mod.Card, "function");
});

test("packages/ui is requireable by workspace name", () => {
  const mod = require("@freelanceflow/ui");

  assert.equal(typeof mod.Button, "function");
  assert.equal(typeof mod.Card, "function");
});
