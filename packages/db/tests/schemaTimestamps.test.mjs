import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

function modelBlock(modelName) {
  const match = schema.match(new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `Expected ${modelName} model to exist`);
  return match[1];
}

test("mutable operational records track update timestamps", () => {
  for (const modelName of ["Payment", "Message", "Notification"]) {
    assert.match(
      modelBlock(modelName),
      /updatedAt\s+DateTime\s+@updatedAt/,
      `${modelName} should include an updatedAt @updatedAt field`
    );
  }
});
