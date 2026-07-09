import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("package.json test script regression check", () => {
  const packageJsonPath = path.resolve(__dirname, "../../package.json");
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonContent);

  const testScript = packageJson.scripts?.test;
  assert.ok(testScript, "test script should exist in package.json");
  assert.ok(!testScript.endsWith("src/tests"), "test script should target files, not the directory 'src/tests'");
  assert.ok(testScript.includes("src/tests/*.test.js") || testScript.includes("src/tests/**/*.test.js"), "test script should target test files pattern");
});
