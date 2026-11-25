import test from "node:test";
import assert from "node:assert/strict";
import {
  truncate,
  slugify,
  escapeRegex,
  sanitizePlainText
} from "../utils/stringUtils.js";

// ==========================================
// 1. Tests for truncate
// ==========================================

test("truncate: truncates strings exceeding maxLength with default suffix", () => {
  const result = truncate("Hello FreelanceFlow community", 15);
  assert.equal(result, "Hello Freela...");
  assert.equal(result.length, 15);
});

test("truncate: handles custom suffix", () => {
  const result = truncate("Enterprise Platform Solution", 12, " [more]");
  assert.equal(result, "Enter [more]");
  assert.equal(result.length, 12);
});

test("truncate: returns original string if length <= maxLength", () => {
  assert.equal(truncate("FreelanceFlow", 20), "FreelanceFlow");
  assert.equal(truncate("Equal", 5), "Equal");
});

test("truncate: returns empty string for null, undefined, or empty string", () => {
  assert.equal(truncate(null, 10), "");
  assert.equal(truncate(undefined, 10), "");
  assert.equal(truncate("", 10), "");
});

test("truncate: safely handles maxLength <= 0", () => {
  assert.equal(truncate("Some text", 0), "");
  assert.equal(truncate("Some text", -5), "");
});

test("truncate: handles suffix longer than or equal to maxLength without exceeding max", () => {
  const result = truncate("Hello World", 3, "....");
  assert.equal(result, "...");
  assert.equal(result.length, 3);
});

test("truncate: coerces non-string input safely", () => {
  assert.equal(truncate(1234567890, 6), "123...");
});

// ==========================================
// 2. Tests for slugify
// ==========================================

test("slugify: converts basic string to lowercase slug with dashes", () => {
  assert.equal(slugify("Hello World From FreelanceFlow"), "hello-world-from-freelanceflow");
});

test("slugify: strips diacritics and accents correctly (NFKD normalization)", () => {
  assert.equal(slugify("Diseño en España con Año Nuevo y Café"), "diseno-en-espana-con-ano-nuevo-y-cafe");
  assert.equal(slugify("Crème brûlée à Paris"), "creme-brulee-a-paris");
});

test("slugify: collapses multiple consecutive spaces, underscores and dashes", () => {
  assert.equal(slugify("  Multiple   --- ___ spaces   "), "multiple-spaces");
});

test("slugify: respects custom separator and options", () => {
  assert.equal(slugify("Custom Separator Test", { separator: "_" }), "custom_separator_test");
  assert.equal(slugify("Keep Case Slug", { lower: false }), "Keep-Case-Slug");
});

test("slugify: clamps to maxLength and trims trailing separator", () => {
  const result = slugify("A very long title that should be clamped cleanly", { maxLength: 12 });
  assert.equal(result, "a-very-long");
  assert(result.length <= 12);
  assert(!result.endsWith("-"));
});

test("slugify: returns empty string for null, undefined, or whitespace", () => {
  assert.equal(slugify(null), "");
  assert.equal(slugify(undefined), "");
  assert.equal(slugify("   "), "");
});

// ==========================================
// 3. Tests for escapeRegex
// ==========================================

test("escapeRegex: escapes all special regex metacharacters", () => {
  const hazardous = ".*+?^${}()|[]\\";
  const escaped = escapeRegex(hazardous);
  assert.equal(escaped, "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");

  // Verify that the escaped string matches itself literally in a RegExp
  const regex = new RegExp(`^${escaped}$`);
  assert(regex.test(hazardous));
  assert(!regex.test("any other text"));
});

test("escapeRegex: prevents ReDoS and invalid pattern crashes in dynamic queries", () => {
  const userQuery = "user+query(unclosed[bracket*test";
  const escaped = escapeRegex(userQuery);
  assert.doesNotThrow(() => {
    const rx = new RegExp(escaped);
    assert(rx.test("Prefix user+query(unclosed[bracket*test Suffix"));
  });
});

test("escapeRegex: returns empty string for null and undefined", () => {
  assert.equal(escapeRegex(null), "");
  assert.equal(escapeRegex(undefined), "");
});

test("escapeRegex: leaves alphanumeric strings unchanged", () => {
  assert.equal(escapeRegex("FreelanceFlow2026"), "FreelanceFlow2026");
});

// ==========================================
// 4. Tests for sanitizePlainText
// ==========================================

test("sanitizePlainText: strips HTML and XML tags", () => {
  const dirty = '<p>Hello <script>alert("xss")</script> <strong class="highlight">FreelanceFlow</strong>!</p>';
  const clean = sanitizePlainText(dirty);
  assert.equal(clean, 'Hello alert("xss") FreelanceFlow!');
});

test("sanitizePlainText: removes null bytes and unprintable control characters", () => {
  const withControlChars = "Clean\x00Text\x07With\x1FHidden\x7FChars";
  assert.equal(sanitizePlainText(withControlChars), "CleanTextWithHiddenChars");
});

test("sanitizePlainText: preserves newlines by default and normalizes CRLF", () => {
  const multiline = "Line 1\r\nLine 2\rLine 3\nLine 4";
  const result = sanitizePlainText(multiline);
  assert.equal(result, "Line 1\nLine 2\nLine 3\nLine 4");
});

test("sanitizePlainText: replaces newlines with space when allowNewlines is false", () => {
  const multiline = "Line 1\nLine 2\n\nLine 3";
  const result = sanitizePlainText(multiline, { allowNewlines: false, collapseWhitespace: true });
  assert.equal(result, "Line 1 Line 2 Line 3");
});

test("sanitizePlainText: clamps length with maxLength option", () => {
  const result = sanitizePlainText("Long descriptive text exceeding max length", { maxLength: 10 });
  assert.equal(result, "Long descr");
  assert.equal(result.length, 10);
});

test("sanitizePlainText: returns empty string for null and undefined", () => {
  assert.equal(sanitizePlainText(null), "");
  assert.equal(sanitizePlainText(undefined), "");
});
