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

test("Job records can persist accepted skills", () => {
  assert.match(modelBlock("Job"), /\bskills\s+Skill\[\]/);
  assert.match(modelBlock("Skill"), /\bjobs\s+Job\[\]/);
});
