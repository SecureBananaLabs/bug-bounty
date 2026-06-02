import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("@freelanceflow/db is importable via the workspace package name", () => {
  const db = require("@freelanceflow/db");

  assert.ok(db);
  assert.equal(typeof db.PrismaClient, "function");
});
