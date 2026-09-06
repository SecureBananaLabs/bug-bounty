const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const test = require("node:test");

const requireFromTest = createRequire(__filename);

test("@freelanceflow/db resolves and loads through the workspace package name", async () => {
  const resolvedPath = requireFromTest.resolve("@freelanceflow/db");
  assert.match(resolvedPath, /packages[/\\]db[/\\]index\.js$/);

  const requiredPackage = requireFromTest("@freelanceflow/db");
  assert.equal(typeof requiredPackage.PrismaClient, "function");

  const importedPackage = await import("@freelanceflow/db");
  assert.equal(typeof importedPackage.default.PrismaClient, "function");
});
