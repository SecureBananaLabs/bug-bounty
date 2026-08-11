import test from "node:test";
import assert from "node:assert/strict";
import { machinPi } from "../src/verify/machin.js";
import { hexDigitAt, hexDigitsAt } from "../src/verify/bbp.js";
import { digitDistribution, CHI_SQUARED_CRITICAL } from "../src/verify/distribution.js";

const KNOWN_100 =
  "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";

// The first 32 hexadecimal digits of the fractional part of pi.
const KNOWN_HEX_32 = "243f6a8885a308d313198a2e03707344";

test("Machin's formula matches the published constant", () => {
  assert.equal(machinPi(100), KNOWN_100);
});

test("Machin's formula shares the output shape of the generator", () => {
  assert.equal(machinPi(0), "3");
  assert.equal(machinPi(1), "3.1");
  assert.equal(machinPi(6), "3.141592");
});

test("Machin's formula rejects invalid input and refuses to run past its cap", () => {
  assert.throws(() => machinPi(-1), RangeError);
  assert.throws(() => machinPi(5001), RangeError);
  assert.throws(() => machinPi(1.5), TypeError);
  assert.throws(() => machinPi("100"), TypeError);
});

test("BBP reproduces the known hexadecimal expansion", () => {
  for (let position = 1; position <= KNOWN_HEX_32.length; position += 1) {
    assert.equal(hexDigitAt(position), KNOWN_HEX_32[position - 1]);
  }
});

test("BBP returns runs of digits from an arbitrary position", () => {
  assert.equal(hexDigitsAt(1, 8), KNOWN_HEX_32.slice(0, 8));
  assert.equal(hexDigitsAt(9, 8), KNOWN_HEX_32.slice(8, 16));
  assert.equal(hexDigitsAt(25, 8), KNOWN_HEX_32.slice(24, 32));
});

test("BBP rejects invalid positions and counts", () => {
  assert.throws(() => hexDigitsAt(0, 1), RangeError);
  assert.throws(() => hexDigitsAt(-1, 1), RangeError);
  assert.throws(() => hexDigitsAt(1, 0), RangeError);
  assert.throws(() => hexDigitsAt(1, 9), RangeError);
  assert.throws(() => hexDigitsAt(1.5, 1), TypeError);
  assert.throws(() => hexDigitsAt("1", 1), TypeError);
});

test("digit distribution counts every digit and ignores the decimal point", () => {
  const report = digitDistribution("3.14159");

  assert.equal(report.total, 6);
  assert.equal(report.counts[1], 2);
  assert.equal(report.counts[3], 1);
  assert.equal(report.counts[9], 1);
  assert.equal(report.expected, 0.6);
  assert.equal(report.degreesOfFreedom, 9);
});

test("a perfectly uniform sequence has a chi-squared of zero", () => {
  assert.equal(digitDistribution("0123456789".repeat(10)).chiSquared, 0);
});

// The check earns its place by rejecting sequences that are not pi's, so a
// degenerate one has to fail it.
test("a repeating sequence fails the chi-squared bound", () => {
  const report = digitDistribution("3." + "142857".repeat(200));

  assert.ok(report.chiSquared > CHI_SQUARED_CRITICAL);
});

test("digit distribution rejects input it cannot count", () => {
  assert.throws(() => digitDistribution("3.14a59"), RangeError);
  assert.throws(() => digitDistribution(""), RangeError);
  assert.throws(() => digitDistribution("."), RangeError);
  assert.throws(() => digitDistribution(3.14159), TypeError);
});
