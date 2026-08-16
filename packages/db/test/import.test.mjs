import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("packages/db is importable by workspace name", async () => {
  const mod = await import("@freelanceflow/db");

  assert.ok(mod);
});

test("packages/db is requireable by workspace name", () => {
  const mod = require("@freelanceflow/db");

  assert.ok(mod);
});
