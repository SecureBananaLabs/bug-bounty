import test from "node:test";
import assert from "node:assert";

test("db package entrypoint validation", async (t) => {
  await t.test("should successfully import PrismaClient and UserRole from @freelanceflow/db", async () => {
    const { PrismaClient, UserRole } = await import("@freelanceflow/db");
    assert.ok(PrismaClient);
    assert.ok(UserRole);
    assert.equal(typeof PrismaClient, "function");
    assert.equal(typeof UserRole, "object");
  });
});
