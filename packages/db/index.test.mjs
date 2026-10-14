import assert from "node:assert/strict";
import test from "node:test";

test("@freelanceflow/db resolves through the workspace package entrypoint", async () => {
  const db = await import("@freelanceflow/db");

  assert.equal(typeof db.PrismaClient, "function");
});
