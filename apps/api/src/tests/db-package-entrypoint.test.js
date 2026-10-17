import test from "node:test";
import assert from "node:assert/strict";

test("@freelanceflow/db exposes a workspace package entrypoint", async () => {
  const dbPackage = await import("@freelanceflow/db");

  assert.equal(typeof dbPackage.PrismaClient, "function");
});
