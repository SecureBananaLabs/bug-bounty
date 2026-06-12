import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeUploadFilename } from "../utils/uploadFilename.js";

test("sanitizeUploadFilename keeps the final path segment", () => {
  assert.equal(sanitizeUploadFilename("../secret.txt"), "secret.txt");
  assert.equal(sanitizeUploadFilename("nested\\folder\\report.csv"), "report.csv");
});

test("sanitizeUploadFilename strips control characters and trims whitespace", () => {
  assert.equal(sanitizeUploadFilename("  \nfinal\rname.txt\t "), "finalname.txt");
});

test("sanitizeUploadFilename caps overly long names", () => {
  const longName = `${"a".repeat(80)}.txt`;
  assert.equal(sanitizeUploadFilename(longName), "a".repeat(64));
});

test("sanitizeUploadFilename returns null for missing or blank values", () => {
  assert.equal(sanitizeUploadFilename(null), null);
  assert.equal(sanitizeUploadFilename("   \n\t  "), null);
});
