import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(__dirname, "../prisma/schema.prisma"), "utf8");

function modelBlock(modelName) {
  const match = schema.match(new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `Expected ${modelName} model to exist`);
  return match[1];
}

test("Job and Skill models keep a bidirectional skills relation", () => {
  assert.match(modelBlock("Job"), /\n\s+skills\s+Skill\[\]/);
  assert.match(modelBlock("Skill"), /\n\s+jobs\s+Job\[\]/);
});
