import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import numberUtils, {
  clamp,
  inRange,
  isNumeric,
  safeParseNumber,
  roundTo,
  lerp,
} from '../utils/numberUtils.js';

describe('numberUtils - Defensive Number Clamping and Range Validation', () => {
  describe('clamp', () => {
    it('clamps numbers within standard inclusive bounds', () => {
      assert.strictEqual(clamp(50, 0, 100), 50);
      assert.strictEqual(clamp(-5, 0, 100), 0);
      assert.strictEqual(clamp(150, 0, 100), 100);
      assert.strictEqual(clamp(0, 0, 100), 0);
      assert.strictEqual(clamp(100, 0, 100), 100);
    });

    it('normalizes inverted boundaries automatically (lower > upper)', () => {
      // Bounds [100, 50] should normalize to [50, 100]
      assert.strictEqual(clamp(75, 100, 50), 75);
      assert.strictEqual(clamp(20, 100, 50), 50);
      assert.strictEqual(clamp(150, 100, 50), 100);
    });

    it('defends against NaN propagation (CWE-682)', () => {
      // If input is NaN or invalid string, returns normalized lower bound
      assert.strictEqual(clamp(NaN, 10, 50), 10);
      assert.strictEqual(clamp('invalid-not-a-number', 5, 25), 5);
      assert.strictEqual(clamp(undefined, 0, 100), 0);
      assert.strictEqual(clamp(null, 10, 20), 10);
    });

    it('handles NaN or missing bounds gracefully without crashing', () => {
      assert.strictEqual(clamp(5, NaN, 10), 5);
      assert.strictEqual(clamp(15, 0, NaN), 15);
      assert.strictEqual(clamp(10, NaN, NaN), 10);
    });

    it('faithfully preserves IEEE-754 negative zero (-0)', () => {
      const clampedNegZero = clamp(-0, -10, 10);
      assert.ok(Object.is(clampedNegZero, -0));
      assert.strictEqual(1 / clampedNegZero, -Infinity);

      // If range is positive only, clamp to positive lower bound
      assert.strictEqual(clamp(-0, 5, 10), 5);

      // If range is negative only, clamp to negative upper bound
      assert.strictEqual(clamp(-0, -10, -2), -2);
    });

    it('supports native BigInt clamping with BigInt and mixed bounds', () => {
      assert.strictEqual(clamp(50n, 10n, 100n), 50n);
      assert.strictEqual(clamp(5n, 10n, 100n), 10n);
      assert.strictEqual(clamp(200n, 10n, 100n), 100n);

      // Inverted BigInt bounds
      assert.strictEqual(clamp(75n, 100n, 50n), 75n);
      assert.strictEqual(clamp(20n, 100n, 50n), 50n);
      assert.strictEqual(clamp(150n, 100n, 50n), 100n);

      // Unconstrained / NaN upper or lower bound
      assert.strictEqual(clamp(100n, 5n, NaN), 100n);
      assert.strictEqual(clamp(100n, 5n, undefined), 100n);
      assert.strictEqual(clamp(100n, 5n, 'invalid'), 100n);
      assert.strictEqual(clamp(2n, 5n, NaN), 5n);
    });

    it('safely coerces numeric strings in inputs and bounds', () => {
      assert.strictEqual(clamp('42', '0', '100'), 42);
      assert.strictEqual(clamp('-15', '0', '100'), 0);
      assert.strictEqual(clamp('250', '0', '100'), 100);
    });
  });

  describe('inRange', () => {
    it('evaluates half-open interval [start, end) by default', () => {
      assert.strictEqual(inRange(3, 2, 4), true);
      assert.strictEqual(inRange(2, 2, 4), true); // start is inclusive
      assert.strictEqual(inRange(4, 2, 4), false); // end is exclusive
      assert.strictEqual(inRange(1.9, 2, 4), false);
      assert.strictEqual(inRange(4.1, 2, 4), false);
    });

    it('assumes start = 0 when end argument is omitted: [0, end)', () => {
      assert.strictEqual(inRange(3, 5), true); // [0, 5)
      assert.strictEqual(inRange(0, 5), true);
      assert.strictEqual(inRange(5, 5), false);
      assert.strictEqual(inRange(-1, 5), false);
    });

    it('normalizes inverted boundaries automatically (start > end)', () => {
      // Range (4, 2) normalizes to [2, 4)
      assert.strictEqual(inRange(3, 4, 2), true);
      assert.strictEqual(inRange(2, 4, 2), true);
      assert.strictEqual(inRange(4, 4, 2), false);
    });

    it('supports inclusive option for closed interval [start, end]', () => {
      assert.strictEqual(inRange(4, 2, 4, { inclusive: true }), true);
      assert.strictEqual(inRange(2, 2, 4, { inclusive: true }), true);
      assert.strictEqual(inRange(5, 2, 4, { inclusive: true }), false);

      // With omitted start
      assert.strictEqual(inRange(5, 5, { inclusive: true }), true);
    });

    it('defends against NaN inputs returning false without exceptions', () => {
      assert.strictEqual(inRange(NaN, 0, 10), false);
      assert.strictEqual(inRange(5, NaN, 10), false);
      assert.strictEqual(inRange(5, 0, NaN), false);
      assert.strictEqual(inRange('not-a-number', 0, 10), false);
    });

    it('supports BigInt range validation', () => {
      assert.strictEqual(inRange(5n, 0n, 10n), true);
      assert.strictEqual(inRange(0n, 0n, 10n), true);
      assert.strictEqual(inRange(10n, 0n, 10n), false);
      assert.strictEqual(inRange(10n, 0n, 10n, { inclusive: true }), true);

      // Inverted BigInt range
      assert.strictEqual(inRange(5n, 10n, 0n), true);

      // BigInt NaN defense
      assert.strictEqual(inRange(5n, 'invalid', 10n), false);
      assert.strictEqual(inRange(5n, NaN, 10n), false);
      assert.strictEqual(inRange(5n, 0n, 'invalid'), false);
      assert.strictEqual(inRange(5n, 0n, NaN), false);
    });
  });

  describe('additional defensive utilities', () => {
    it('isNumeric checks numbers, BigInts, and numeric strings accurately', () => {
      assert.strictEqual(isNumeric(42), true);
      assert.strictEqual(isNumeric(-3.14), true);
      assert.strictEqual(isNumeric(0), true);
      assert.strictEqual(isNumeric(100n), true);
      assert.strictEqual(isNumeric('123.45'), true);
      assert.strictEqual(isNumeric('-99'), true);

      assert.strictEqual(isNumeric(NaN), false);
      assert.strictEqual(isNumeric(Infinity), false);
      assert.strictEqual(isNumeric(-Infinity), false);
      assert.strictEqual(isNumeric(''), false);
      assert.strictEqual(isNumeric('   '), false);
      assert.strictEqual(isNumeric('abc'), false);
      assert.strictEqual(isNumeric(null), false);
      assert.strictEqual(isNumeric(undefined), false);
      assert.strictEqual(isNumeric({}), false);
    });

    it('safeParseNumber converts valid values or returns fallback', () => {
      assert.strictEqual(safeParseNumber('42.5'), 42.5);
      assert.strictEqual(safeParseNumber(100n), 100);
      assert.strictEqual(safeParseNumber('invalid', 99), 99);
      assert.strictEqual(safeParseNumber(NaN, -1), -1);
      assert.strictEqual(safeParseNumber(undefined, 0), 0);
    });

    it('roundTo rounds without floating point drift and preserves -0', () => {
      assert.strictEqual(roundTo(1.005, 2), 1.01);
      assert.strictEqual(roundTo(12.3456, 3), 12.346);
      assert.strictEqual(roundTo(10.5), 11);

      const negZero = roundTo(-0);
      assert.ok(Object.is(negZero, -0));
    });

    it('lerp interpolates between two numbers with bounds clamping', () => {
      assert.strictEqual(lerp(0, 100, 0.5), 50);
      assert.strictEqual(lerp(10, 20, 0), 10);
      assert.strictEqual(lerp(10, 20, 1), 20);
      // Clamped beyond [0, 1]
      assert.strictEqual(lerp(0, 100, 1.5, true), 100);
      assert.strictEqual(lerp(0, 100, -0.5, true), 0);
      // Unbounded
      assert.strictEqual(lerp(0, 100, 1.5, false), 150);
    });

    it('exports all utilities on default object', () => {
      assert.strictEqual(numberUtils.clamp, clamp);
      assert.strictEqual(numberUtils.inRange, inRange);
      assert.strictEqual(numberUtils.isNumeric, isNumeric);
      assert.strictEqual(numberUtils.safeParseNumber, safeParseNumber);
      assert.strictEqual(numberUtils.roundTo, roundTo);
      assert.strictEqual(numberUtils.lerp, lerp);
    });
  });
});
