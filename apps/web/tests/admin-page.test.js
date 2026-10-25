import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const pagePath = resolve("apps/web/app/admin/page.tsx");

test("admin panel renders moderation overview", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /Moderation queue/);
  assert.match(source, /Trust metrics/);
  assert.match(source, /Platform controls/);
  assert.match(source, /queueSize/);
});
