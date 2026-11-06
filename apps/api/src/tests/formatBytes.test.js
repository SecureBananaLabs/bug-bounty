import test from "node:test";
import assert from "node:assert/strict";
import { formatBytes } from "../utils/formatBytes.js";

test("formatBytes formats 0 bytes accurately", () => {
  assert.equal(formatBytes(0), "0 Bytes");
});

test("formatBytes formats exact kilobyte and megabyte values", () => {
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1024 * 1024), "1 MB");
  assert.equal(formatBytes(1024 * 1024 * 1024), "1 GB");
});

test("formatBytes formats fractional values with custom decimals", () => {
  assert.equal(formatBytes(1536, 1), "1.5 KB");
  assert.equal(formatBytes(2621440, 2), "2.5 MB");
});

test("formatBytes formats terabytes and large magnitudes", () => {
  assert.equal(formatBytes(1024 ** 4), "1 TB");
});

test("formatBytes safely handles negative numbers, NaN, and non-number types", () => {
  assert.equal(formatBytes(-100), "0 Bytes");
  assert.equal(formatBytes(NaN), "0 Bytes");
  assert.equal(formatBytes(null), "0 Bytes");
  assert.equal(formatBytes(undefined), "0 Bytes");
  assert.equal(formatBytes("1024"), "0 Bytes");
});
