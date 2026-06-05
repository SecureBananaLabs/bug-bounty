const test = require("node:test");
const assert = require("node:assert/strict");

test("@freelanceflow/db resolves through the workspace package name", () => {
  const dbPackage = require("@freelanceflow/db");

  assert.equal(typeof dbPackage.PrismaClient, "function");
});
