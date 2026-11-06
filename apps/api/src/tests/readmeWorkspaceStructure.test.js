import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("README workspace structure uses ASCII separators", async () => {
  const readme = await readFile(new URL("../../../../README.md", import.meta.url), "utf8");

  assert.match(readme, /- `apps\/web` - /);
  assert.match(readme, /- `apps\/api` - /);
  assert.match(readme, /- `packages\/db` - /);
  assert.match(readme, /- `packages\/ui` - /);
  assert.doesNotMatch(readme, /â€”/);
});
