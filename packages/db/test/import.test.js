const assert = require("node:assert/strict");
const test = require("node:test");

test("workspace package can be imported by name", async () => {
  const mod = await import("@freelanceflow/db");
  const prismaClient = mod.PrismaClient ?? mod.default?.PrismaClient;

  assert.equal(typeof prismaClient, "function");
});
