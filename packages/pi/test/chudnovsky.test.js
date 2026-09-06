import test from "node:test";
import assert from "node:assert/strict";
import { computePi, computePiWithGuard, defaultGuardDigits } from "../src/chudnovsky.js";

const KNOWN_100 =
  "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";

// The last eleven decimal places of the first thousand, which is the standard
// checkpoint for this computation.
const KNOWN_1000_TAIL = "92164201989";

test("first 100 decimal places match the published constant", () => {
  assert.equal(computePi(100), KNOWN_100);
});

test("first 1,000 decimal places end at the known checkpoint", () => {
  const value = computePi(1000);

  assert.equal(value.length, 1002);
  assert.ok(value.endsWith(KNOWN_1000_TAIL));
});

test("small requests are truncated, never rounded", () => {
  assert.equal(computePi(0), "3");
  assert.equal(computePi(1), "3.1");
  assert.equal(computePi(2), "3.14");

  // The sixth decimal place is 2, followed by 6. Rounding would give 3.141593.
  assert.equal(computePi(6), "3.141592");
});

test("a longer computation extends a shorter one", () => {
  const long = computePi(1000);

  assert.ok(long.startsWith(computePi(100)));
  assert.ok(long.startsWith(computePi(500)));
});

// A contaminated tail is the usual failure in this class of program: the guard
// digits absorb the truncation losses at one allowance but not at another, so
// widening the allowance changes the answer. Identical output is the evidence
// that the shipped rule is sufficient.
test("output is stable against a wider guard allowance", () => {
  for (const digits of [50, 200, 1000]) {
    const guard = defaultGuardDigits(digits);

    assert.equal(computePiWithGuard(digits, guard + 25), computePiWithGuard(digits, guard));
    assert.equal(computePiWithGuard(digits, guard + 60), computePi(digits));
  }
});

test("the guard allowance grows with the term count", () => {
  assert.ok(defaultGuardDigits(0) >= 15);
  assert.ok(defaultGuardDigits(10000) > defaultGuardDigits(100));
});

test("computePi rejects invalid input", () => {
  assert.throws(() => computePi(-1), RangeError);
  assert.throws(() => computePi(1.5), TypeError);
  assert.throws(() => computePi("100"), TypeError);
  assert.throws(() => computePi(Number.NaN), TypeError);
  assert.throws(() => computePi(Number.POSITIVE_INFINITY), TypeError);
  assert.throws(() => computePi(), TypeError);
});

test("computePiWithGuard requires at least one guard digit", () => {
  assert.throws(() => computePiWithGuard(10, 0), RangeError);
  assert.throws(() => computePiWithGuard(10, -5), RangeError);
  assert.throws(() => computePiWithGuard(10, 2.5), TypeError);
});
