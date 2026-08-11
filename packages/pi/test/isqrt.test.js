import test from "node:test";
import assert from "node:assert/strict";
import { isqrt } from "../src/isqrt.js";

test("isqrt returns exact roots of perfect squares", () => {
  assert.equal(isqrt(0n), 0n);
  assert.equal(isqrt(1n), 1n);
  assert.equal(isqrt(4n), 2n);
  assert.equal(isqrt(9n), 3n);
  assert.equal(isqrt(144n), 12n);
  assert.equal(isqrt(10n ** 18n), 10n ** 9n);
});

test("isqrt truncates towards zero between squares", () => {
  assert.equal(isqrt(2n), 1n);
  assert.equal(isqrt(3n), 1n);
  assert.equal(isqrt(8n), 2n);
  assert.equal(isqrt(10n), 3n);
  assert.equal(isqrt(15n), 3n);
  assert.equal(isqrt(99n), 9n);
});

test("isqrt is floor-correct either side of a square boundary", () => {
  const root = 10n ** 25n;
  const square = root * root;

  assert.equal(isqrt(square - 1n), root - 1n);
  assert.equal(isqrt(square), root);
  assert.equal(isqrt(square + 1n), root);
});

// The bracketing property is the definition of the floor of the root, so it
// holds for operands far too large to check against a known answer.
test("isqrt brackets the root for large non-squares", () => {
  const operands = [10005n * 10n ** 200n, 2n ** 601n, 7n * 10n ** 999n + 3n];

  for (const operand of operands) {
    const root = isqrt(operand);

    assert.ok(root * root <= operand);
    assert.ok((root + 1n) * (root + 1n) > operand);
  }
});

test("isqrt rejects invalid input", () => {
  assert.throws(() => isqrt(-1n), RangeError);
  assert.throws(() => isqrt(4), TypeError);
  assert.throws(() => isqrt("4"), TypeError);
  assert.throws(() => isqrt(undefined), TypeError);
});
