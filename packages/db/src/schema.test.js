const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const schemaPath = join(__dirname, "../prisma/schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

function modelBlock(modelName) {
  const match = schema.match(new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `Expected ${modelName} model to exist in Prisma schema`);
  return match[1];
}

test("mutable operational records track updates", () => {
  for (const modelName of ["Payment", "Message", "Notification"]) {
    assert.match(modelBlock(modelName), /\bupdatedAt\s+DateTime\s+@updatedAt\b/);
  }
});
