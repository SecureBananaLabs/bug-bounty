const test = require("node:test");
const assert = require("node:assert/strict");

test("@freelanceflow/db can be imported through its package entrypoint", () => {
  const dbPackage = require("@freelanceflow/db");

  assert.equal(typeof dbPackage.PrismaClient, "function");
});
