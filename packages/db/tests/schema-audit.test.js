const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const schema = readFileSync(path.join(__dirname, "../prisma/schema.prisma"), "utf8");

function modelBlock(modelName) {
  const match = schema.match(new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `${modelName} model should exist in Prisma schema`);
  return match[1];
}

for (const modelName of ["Payment", "Message", "Notification"]) {
  test(`${modelName} tracks state changes with updatedAt`, () => {
    assert.match(modelBlock(modelName), /updatedAt\s+DateTime\s+@updatedAt/);
  });
}
