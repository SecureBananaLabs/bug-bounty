import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const pkgUrl = new URL("../../package.json", import.meta.url);

test("api test script targets test files, not a bare directory", () => {
  const pkg = JSON.parse(readFileSync(pkgUrl, "utf8"));
  const script = pkg.scripts.test;

  assert.match(script, /^node --test /);
  // A bare directory makes Node treat it as a module target and exit non-zero.
  assert.match(script, /\.test\.js"?\s*$/);
});
