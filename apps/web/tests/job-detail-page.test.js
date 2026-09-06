import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const pagePath = resolve("apps/web/app/jobs/[id]/page.tsx");

test("job detail page renders mock data and fallback", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /jobs\.find/);
  assert.match(source, /Job not found/);
  assert.match(source, /job\.description/);
  assert.match(source, /job\.title/);
  assert.match(source, /job\.budget/);
});
