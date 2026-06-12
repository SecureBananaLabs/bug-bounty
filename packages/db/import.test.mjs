import test from "node:test";
import assert from "node:assert/strict";

test("@freelanceflow/db is importable by package name", async () => {
  const db = await import("@freelanceflow/db");

  assert.equal(typeof db.PrismaClient, "function");
  assert.equal(typeof db.Prisma, "object");
});
