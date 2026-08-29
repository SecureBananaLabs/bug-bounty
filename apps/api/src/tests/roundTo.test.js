import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { roundTo } from '../utils/roundTo.js';

describe('roundTo', () => {
  test('correctly rounds problematic binary floating-point numbers', () => {
    // 1.005.toFixed(2) === "1.00" in vanilla JS due to floating point representation
    assert.equal(roundTo(1.005, 2), 1.01);
    assert.equal(roundTo(1.055, 2), 1.06);
    assert.equal(roundTo(35.855, 2), 35.86);
  });

  test('rounds to integers when decimals is 0', () => {
    assert.equal(roundTo(1.4, 0), 1);
    assert.equal(roundTo(1.5, 0), 2);
    assert.equal(roundTo(1.6, 0), 2);
  });

  test('supports ceil, floor, and trunc rounding modes', () => {
    assert.equal(roundTo(1.234, 2, 'ceil'), 1.24);
    assert.equal(roundTo(1.239, 2, 'floor'), 1.23);
    assert.equal(roundTo(-1.239, 2, 'trunc'), -1.23);
    assert.equal(roundTo(1.239, 2, 'trunc'), 1.23);
  });

  test('supports banker rounding (half-even)', () => {
    assert.equal(roundTo(2.5, 0, 'half-even'), 2); // rounds to even 2
    assert.equal(roundTo(3.5, 0, 'half-even'), 4); // rounds to even 4
    assert.equal(roundTo(2.55, 1, 'half-even'), 2.6); // 25.5 -> 26 -> 2.6
    assert.equal(roundTo(2.45, 1, 'half-even'), 2.4); // 24.5 -> 24 -> 2.4
  });

  test('handles numeric strings and edge cases', () => {
    assert.equal(roundTo('123.4567', 3), 123.457);
    assert.equal(Number.isNaN(roundTo(NaN)), true);
    assert.equal(roundTo(Infinity), Infinity);
    assert.equal(roundTo(-Infinity), -Infinity);
  });

  test('throws RangeError for negative decimal places', () => {
    assert.throws(() => roundTo(100, -1), RangeError);
  });
});
