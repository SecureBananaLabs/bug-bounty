import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeFilename } from "../utils/sanitize.js";

test("sanitizeFilename strips path components", () => {
  assert.equal(sanitizeFilename("../../etc/passwd"), "passwd");
  assert.equal(sanitizeFilename("C:\\Users\\me\\evil.txt"), "evil.txt");
  assert.equal(sanitizeFilename("/var/log/../etc/shadow"), "shadow");
});

test("sanitizeFilename replaces unsafe characters with underscore", () => {
  assert.equal(sanitizeFilename("my file (1).png"), "my_file_1_.png");
  assert.equal(sanitizeFilename("name<script>.pdf"), "name_script_.pdf");
});

test("sanitizeFilename strips control characters", () => {
  const dirty = "file\u0000\u0007name\u001f.txt";
  assert.equal(sanitizeFilename(dirty), "filename.txt");
});

test("sanitizeFilename returns fallback for empty/invalid input", () => {
  assert.equal(sanitizeFilename(""), "file");
  assert.equal(sanitizeFilename(null), "file");
  assert.equal(sanitizeFilename("   "), "file");
  assert.equal(sanitizeFilename("..."), "file");
  assert.equal(sanitizeFilename("__"), "file");
});

test("sanitizeFilename truncates long names while preserving extension", () => {
  const longName = "a".repeat(300) + ".txt";
  const result = sanitizeFilename(longName);
  assert.ok(result.length <= 255, `expected <=255 got ${result.length}`);
  assert.ok(result.endsWith(".txt"));
});

test("sanitizeFilename truncates multi-dot names preserving only the final extension", () => {
  const longName = "a".repeat(300) + ".tar.gz";
  const result = sanitizeFilename(longName);
  assert.ok(result.length <= 255, `expected <=255 got ${result.length}`);
  assert.ok(result.endsWith(".gz"));
});

test("sanitizeFilename collapses repeated underscores", () => {
  assert.equal(sanitizeFilename("a___b___c.png"), "a_b_c.png");
});

test("sanitizeFilename allows normal filenames through unchanged", () => {
  assert.equal(sanitizeFilename("report_2026.pdf"), "report_2026.pdf");
  assert.equal(sanitizeFilename("image-2.JPG"), "image-2.JPG");
});
