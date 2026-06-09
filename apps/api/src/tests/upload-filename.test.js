import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeUploadFilename } from "../controllers/uploadController.js";

test("sanitizeUploadFilename strips path segments", () => {
  assert.equal(sanitizeUploadFilename("../private/secret.txt"), "secret.txt");
  assert.equal(sanitizeUploadFilename("..\\private\\invoice.pdf"), "invoice.pdf");
});

test("sanitizeUploadFilename removes control characters and trims whitespace", () => {
  assert.equal(sanitizeUploadFilename(" \nreport\t.csv\r "), "report.csv");
});

test("sanitizeUploadFilename caps long names and falls back for blank metadata", () => {
  assert.equal(sanitizeUploadFilename("\n\t"), "upload");
  assert.equal(sanitizeUploadFilename("x".repeat(140)).length, 128);
});
