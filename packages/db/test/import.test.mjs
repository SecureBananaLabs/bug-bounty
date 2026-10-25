import assert from "node:assert/strict";
import { test } from "node:test";

test("@freelanceflow/db exposes a package-name import", async () => {
  const db = await import("@freelanceflow/db");

  assert.equal(typeof db.PrismaClient, "function");
  assert.ok(db.Prisma);
});
