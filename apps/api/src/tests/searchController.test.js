import test from "node:test";
import assert from "node:assert/strict";

// We import sanitizeQuery directly; the controller depends on globalSearch
// (from searchService) so it can be exercised by stubbing the import.
import { sanitizeQuery } from "../controllers/searchController.js";

test("sanitizeQuery returns empty string for non-strings", () => {
  assert.equal(sanitizeQuery(undefined), "");
  assert.equal(sanitizeQuery(null), "");
  assert.equal(sanitizeQuery(42), "");
  assert.equal(sanitizeQuery({}), "");
});

test("sanitizeQuery strips control characters", () => {
  assert.equal(sanitizeQuery("hello\u0000\u0007world"), "helloworld");
  assert.equal(sanitizeQuery("a\u001fb"), "ab");
});

test("sanitizeQuery collapses whitespace runs", () => {
  assert.equal(sanitizeQuery("foo   bar\t\tbaz"), "foo bar baz");
  assert.equal(sanitizeQuery("  leading and trailing  "), "leading and trailing");
});

test("sanitizeQuery caps query length at 200 chars", () => {
  const long = "x".repeat(500);
  const result = sanitizeQuery(long);
  assert.equal(result.length, 200);
});

test("sanitizeQuery trims surrounding whitespace", () => {
  assert.equal(sanitizeQuery("   hello   "), "hello");
});

test("sanitizeQuery returns empty for control-only input", () => {
  assert.equal(sanitizeQuery("\u0000\u0001\u0002"), "");
  assert.equal(sanitizeQuery("   "), "");
});
