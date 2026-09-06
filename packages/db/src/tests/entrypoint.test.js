const test = require("node:test");
const assert = require("node:assert/strict");

test("@freelanceflow/db exposes the workspace package entrypoint", () => {
  const db = require("@freelanceflow/db");

  assert.equal(typeof db.PrismaClient, "function");
});
