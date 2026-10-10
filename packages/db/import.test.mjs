import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

test("@freelanceflow/db resolves through the workspace package name", () => {
  const resolved = require.resolve("@freelanceflow/db");
  const expected = path.resolve(fileURLToPath(new URL("index.js", import.meta.url)));

  assert.equal(resolved, expected);
});

test("@freelanceflow/db can be imported by package name", async () => {
  const db = await import("@freelanceflow/db");

  assert.equal(typeof db.default, "object");
});
