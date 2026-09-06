import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const pagePath = resolve("apps/web/app/freelancers/[username]/page.tsx");

test("freelancer profile page renders mock data and fallback", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /freelancers\.find/);
  assert.match(source, /Freelancer not found/);
  assert.match(source, /freelancer\.skills\.join/);
  assert.match(source, /freelancer\.rate/);
  assert.match(source, /freelancer\.username/);
});
