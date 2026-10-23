import test from "node:test";
import assert from "node:assert/strict";
import { formatBytes, parseBytes } from "../utils/formatBytes.js";

test("formatBytes - standard byte thresholds (base 1024)", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1), "1 B");
  assert.equal(formatBytes(500), "500 B");
  assert.equal(formatBytes(1023), "1023 B");
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(1024 * 1024), "1 MB");
  assert.equal(formatBytes(1.5 * 1024 * 1024), "1.5 MB");
  assert.equal(formatBytes(1024 * 1024 * 1024), "1 GB");
  assert.equal(formatBytes(2.25 * 1024 * 1024 * 1024), "2.25 GB");
  assert.equal(formatBytes(1024 * 1024 * 1024 * 1024), "1 TB");
  assert.equal(formatBytes(1024 * 1024 * 1024 * 1024 * 1024), "1 PB");
});

test("formatBytes - decimals and precision configuration", () => {
  const bytes = 1536; // 1.5 KB
  assert.equal(formatBytes(bytes, 0), "2 KB");
  assert.equal(formatBytes(bytes, 1), "1.5 KB");
  assert.equal(formatBytes(bytes, 2), "1.5 KB");
  assert.equal(formatBytes(bytes, 3), "1.5 KB");

  // Negative decimal argument should clamp to 0 decimals
  assert.equal(formatBytes(bytes, -2), "2 KB");

  // Non-integer float decimals argument
  assert.equal(formatBytes(bytes, 1.8), "1.5 KB");

  // preserveTrailingZeros option
  assert.equal(formatBytes(bytes, { decimals: 2, preserveTrailingZeros: true }), "1.50 KB");
  assert.equal(formatBytes(1024, { decimals: 3, preserveTrailingZeros: true }), "1.000 KB");
});

test("formatBytes - fail-safe handling on invalid, negative, or exotic inputs", () => {
  // Negative numbers
  assert.equal(formatBytes(-1), "0 B");
  assert.equal(formatBytes(-1024), "0 B");
  assert.equal(formatBytes(-Infinity), "0 B");

  // Non-finite and NaN
  assert.equal(formatBytes(NaN), "0 B");
  assert.equal(formatBytes(Infinity), "0 B");

  // Null, undefined, empty, and non-numeric types
  assert.equal(formatBytes(null), "0 B");
  assert.equal(formatBytes(undefined), "0 B");
  assert.equal(formatBytes(""), "0 B");
  assert.equal(formatBytes("   "), "0 B");
  assert.equal(formatBytes(true), "0 B");
  assert.equal(formatBytes(false), "0 B");
  assert.equal(formatBytes({}), "0 B");
  assert.equal(formatBytes([]), "0 B");
  assert.equal(formatBytes("not-a-number"), "0 B");
});

test("formatBytes - numeric strings parsing", () => {
  assert.equal(formatBytes("1024"), "1 KB");
  assert.equal(formatBytes("1048576"), "1 MB");
  assert.equal(formatBytes("1536", 1), "1.5 KB");
  assert.equal(formatBytes("0"), "0 B");
});

test("formatBytes - custom units and separators", () => {
  // Custom unit labels
  const customUnits = ["Bytes", "Kilo", "Mega", "Giga", "Tera", "Peta"];
  assert.equal(formatBytes(1024, { units: customUnits }), "1 Kilo");
  assert.equal(formatBytes(2048, { units: customUnits }), "2 Kilo");
  assert.equal(formatBytes(1048576, { units: customUnits }), "1 Mega");

  // Custom separator (e.g. no space)
  assert.equal(formatBytes(1024, { separator: "" }), "1KB");
  assert.equal(formatBytes(1024 * 1024, { separator: "-" }), "1-MB");
});

test("parseBytes - converts formatted string back to byte count", () => {
  assert.equal(parseBytes("0 B"), 0);
  assert.equal(parseBytes("1024 B"), 1024);
  assert.equal(parseBytes("1 KB"), 1024);
  assert.equal(parseBytes("1.5 KB"), 1536);
  assert.equal(parseBytes("1 MB"), 1048576);
  assert.equal(parseBytes("1.5 MB"), 1572864);
  assert.equal(parseBytes("2 GB"), 2147483648);
  assert.equal(parseBytes("1 TB"), 1099511627776);

  // Case insensitive and compact units
  assert.equal(parseBytes("500kb"), 512000);
  assert.equal(parseBytes("2mb"), 2097152);
  assert.equal(parseBytes("10K"), 10240);

  // Invalid strings return 0
  assert.equal(parseBytes(""), 0);
  assert.equal(parseBytes("invalid"), 0);
  assert.equal(parseBytes("-50 MB"), 0);
  assert.equal(parseBytes(null), 0);
  assert.equal(parseBytes(undefined), 0);
});
