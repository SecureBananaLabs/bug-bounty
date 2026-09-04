import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("API test script targets test files", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8")
  );

  assert.equal(packageJson.scripts.test, 'node --test "src/tests/*.test.js"');
});
