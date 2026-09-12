import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

test("@freelanceflow/ui resolves through the workspace package name", () => {
  const resolved = require.resolve("@freelanceflow/ui");
  const expected = path.resolve(fileURLToPath(new URL("index.js", import.meta.url)));

  assert.equal(resolved, expected);
});

test("@freelanceflow/ui can be imported by package name", async () => {
  const ui = await import("@freelanceflow/ui");

  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
});
