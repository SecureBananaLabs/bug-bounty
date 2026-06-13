import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const profileRouteSource = await readFile(
  new URL("../app/freelancers/[username]/page.tsx", import.meta.url),
  "utf8",
);
const mockSource = await readFile(new URL("../lib/mock.ts", import.meta.url), "utf8");

test("freelancer profile route looks up known mock profiles", () => {
  assert.match(profileRouteSource, /import \{ freelancers \} from "\.\.\/\.\.\/\.\.\/lib\/mock"/);
  assert.match(profileRouteSource, /freelancers\.find/);
  assert.match(profileRouteSource, /candidate\)\s*=>\s*candidate\.username === params\.username/);
  assert.match(profileRouteSource, /freelancer\.skills\.join\(", "\)/);
  assert.match(profileRouteSource, /freelancer\.rate/);
});

test("freelancer profile route preserves a not-found fallback", () => {
  assert.match(mockSource, /username:\s*"maya-dev"/);
  assert.match(mockSource, /username:\s*"jordan-ux"/);
  assert.match(profileRouteSource, /Freelancer Not Found/);
  assert.match(profileRouteSource, /No mock freelancer profile exists/);
});
