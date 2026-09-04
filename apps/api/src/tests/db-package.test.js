import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);

test("@freelanceflow/db can be imported by workspace package name", async () => {
  const esm = await import("@freelanceflow/db");
  const cjs = require("@freelanceflow/db");

  assert.equal(typeof esm.PrismaClient, "function");
  assert.equal(typeof cjs.PrismaClient, "function");
});
