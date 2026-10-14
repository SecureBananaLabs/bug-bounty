import test from "node:test";
import assert from "node:assert/strict";
import { computePi, hexDigitAt, verifyPi } from "../src/index.js";
import { machinPi } from "../src/verify/machin.js";
import { hexDigitsAt } from "../src/verify/bbp.js";
import { digitDistribution, CHI_SQUARED_CRITICAL } from "../src/verify/distribution.js";

const CROSS_CHECK_DIGITS = 500;
const AUDIT_DIGITS = 2000;
const SAMPLE_DIGITS = 10000;
const PROBE_WIDTH = 4;

test("the public surface exports the three documented entry points", () => {
  assert.equal(typeof computePi, "function");
  assert.equal(typeof hexDigitAt, "function");
  assert.equal(typeof verifyPi, "function");
});

// Machin and Chudnovsky share no code, so agreement over several hundred places
// is evidence rather than tautology. Either one being wrong breaks this.
test("Machin's formula agrees with Chudnovsky", () => {
  assert.equal(machinPi(CROSS_CHECK_DIGITS), computePi(CROSS_CHECK_DIGITS));
});

// BBP computes a hexadecimal digit without producing any digit before it, so
// probing the deep end of the run audits digits that no earlier check reached.
test("BBP agrees with Chudnovsky at positions across the whole run", () => {
  const hex = toHex(computePi(AUDIT_DIGITS), AUDIT_DIGITS);
  const last = hex.length - PROBE_WIDTH + 1;
  const positions = [1, 2, 17, 250, Math.floor(last / 2), last - 1, last];

  for (const position of positions) {
    const expected = hex.slice(position - 1, position - 1 + PROBE_WIDTH);

    assert.equal(hexDigitsAt(position, PROBE_WIDTH), expected, `hexadecimal position ${position}`);
  }
});

test("a large sample of digits sits near a uniform distribution", () => {
  const report = digitDistribution(computePi(SAMPLE_DIGITS));

  assert.equal(report.total, SAMPLE_DIGITS + 1);
  assert.ok(
    report.chiSquared <= CHI_SQUARED_CRITICAL,
    `chi-squared ${report.chiSquared} exceeds ${CHI_SQUARED_CRITICAL}`
  );
});

test("verifyPi passes every check across a range of sizes", () => {
  for (const digits of [0, 1, 50, 100, 1000]) {
    const report = verifyPi(digits);

    assert.equal(report.digits, digits);
    assert.equal(report.value, computePi(digits));
    assert.equal(report.checks.length, 5);
    assert.ok(report.passed, failedCheckNames(report));
  }
});

test("verifyPi reports each check by name", () => {
  const names = verifyPi(200).checks.map((check) => check.name);

  assert.deepEqual(names, [
    "known prefix",
    "guard stability",
    "cross-algorithm agreement",
    "bbp spot audit",
    "digit distribution"
  ]);
});

test("verifyPi rejects invalid input", () => {
  assert.throws(() => verifyPi(-1), RangeError);
  assert.throws(() => verifyPi(1.5), TypeError);
});

// Rebases the decimal output into hexadecimal so the BBP oracle has something
// independent to be compared against: log2(10) bits per decimal digit, four
// bits per hexadecimal digit, less one digit of slack for the truncated tail.
function toHex(value, digits) {
  const width = Math.floor((digits * Math.log2(10)) / 4) - 1;
  const fraction = BigInt(value.slice(2));

  return ((fraction * 16n ** BigInt(width)) / 10n ** BigInt(digits)).toString(16).padStart(width, "0");
}

function failedCheckNames(report) {
  return report.checks
    .filter((check) => !check.passed)
    .map((check) => check.name)
    .join(", ");
}
