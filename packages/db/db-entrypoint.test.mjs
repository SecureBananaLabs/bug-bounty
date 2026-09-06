import assert from "node:assert/strict";
import test from "node:test";

test("db package is directly importable by workspace consumers", async () => {
  const db = await import("@freelanceflow/db");

  assert.equal(typeof db.PrismaClient, "function");
  assert.ok(db.Prisma);
});
