const test = require("node:test");
const assert = require("node:assert/strict");

test("@freelanceflow/db exposes Prisma client exports", () => {
  const resolved = require.resolve("@freelanceflow/db").replace(/\\/g, "/");
  assert.match(resolved, /packages\/db\/src\/index\.js$/);

  const db = require("@freelanceflow/db");
  assert.equal(typeof db.PrismaClient, "function");
});
