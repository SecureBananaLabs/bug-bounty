import test from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../utils/slugify.js";

test("slugify converts basic strings to lowercase hyphenated format", () => {
  assert.equal(slugify("Senior React & Node Developer"), "senior-react-node-developer");
});

test("slugify removes accents and diacritics", () => {
  assert.equal(slugify("Crème Brûlée & Café"), "creme-brulee-cafe");
});

test("slugify strips special characters and collapses multiple hyphens", () => {
  assert.equal(slugify("Hello! @World #2026 --- test"), "hello-world-2026-test");
});

test("slugify trims leading and trailing hyphens and spaces", () => {
  assert.equal(slugify("   --Important Notice--   "), "important-notice");
});

test("slugify respects maxLength option", () => {
  const longTitle = "A very long job post title that should be truncated to prevent URL overflow issues";
  const slug = slugify(longTitle, { maxLength: 20 });
  assert.ok(slug.length <= 20);
  assert.equal(slug, "a-very-long-job-post");
});

test("slugify safely handles non-string inputs", () => {
  assert.equal(slugify(null), "");
  assert.equal(slugify(undefined), "");
  assert.equal(slugify(12345), "");
});
