import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

test("@freelanceflow/db is importable by package name", async () => {
  const db = await import("@freelanceflow/db");
  const require = createRequire(import.meta.url);
  const cjsDb = require("@freelanceflow/db");
  const pkg = JSON.parse(
    await readFile(new URL("./package.json", import.meta.url), "utf8"),
  );

  assert.equal(typeof db.PrismaClient, "function");
  assert.equal(typeof db.Prisma, "object");
  assert.equal(typeof cjsDb.PrismaClient, "function");
  assert.equal(typeof cjsDb.Prisma, "object");
  assert.equal(pkg.exports["."].default, "./index.js");
});
