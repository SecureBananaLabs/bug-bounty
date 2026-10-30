import test from "node:test";
import assert from "node:assert/strict";

test("@freelanceflow/db exposes the workspace package entrypoint", async () => {
  const db = await import("@freelanceflow/db");

  assert.equal(typeof db.PrismaClient, "function");
});
