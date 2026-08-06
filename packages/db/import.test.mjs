import assert from "node:assert/strict";
import { test } from "node:test";

test("@freelanceflow/db resolves through its workspace package name", async () => {
  const dbPackage = await import("@freelanceflow/db");

  assert.equal(typeof dbPackage.PrismaClient, "function");
  assert.ok(dbPackage.Prisma);
});
