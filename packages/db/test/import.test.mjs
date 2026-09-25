import assert from "node:assert/strict";
import { test } from "node:test";

test("@freelanceflow/db can be imported by package name", async () => {
  const db = await import("@freelanceflow/db");

  assert.ok(db.PrismaClient);
});
