import test from "node:test";
import assert from "node:assert/strict";
import { navigationLinks } from "./navigationLinks.mjs";

test("global navigation exposes existing workflow pages", () => {
  const hrefs = new Set(navigationLinks.map((link) => link.href));

  assert.equal(hrefs.size, navigationLinks.length, "navigation hrefs should be unique");
  assert.ok(hrefs.has("/jobs/post"));
  assert.ok(hrefs.has("/notifications"));
  assert.ok(hrefs.has("/billing"));
  assert.ok(hrefs.has("/settings"));
});
