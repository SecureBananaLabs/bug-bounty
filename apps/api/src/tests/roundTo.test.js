import { describe, it } from 'node:test';
import assert from 'node:assert';
import { roundTo } from '../utils/roundTo.js';

describe('roundTo Utility', () => {
  it('should accurately round standard decimals avoiding floating point inaccuracies', () => {
    assert.strictEqual(roundTo(1.005, 2), 1.01);
    assert.strictEqual(roundTo(1.055, 2), 1.06);
    assert.strictEqual(roundTo(35.855, 2), 35.86);
    assert.strictEqual(roundTo(1.23456, 3), 1.235);
  });

  it('should default to 0 decimals with half-up mode', () => {
    assert.strictEqual(roundTo(4.5), 5);
    assert.strictEqual(roundTo(4.4), 4);
    assert.strictEqual(roundTo(-4.5), -4);
  });

  it('should handle ceil, floor, and trunc rounding modes', () => {
    assert.strictEqual(roundTo(1.234, 2, 'ceil'), 1.24);
    assert.strictEqual(roundTo(1.239, 2, 'floor'), 1.23);
    assert.strictEqual(roundTo(1.239, 2, 'trunc'), 1.23);
    assert.strictEqual(roundTo(-1.239, 2, 'trunc'), -1.23);
    assert.strictEqual(roundTo(-1.231, 2, 'floor'), -1.24);
  });

  it('should handle bankers / half-even rounding mode accurately', () => {
    assert.strictEqual(roundTo(2.5, 0, 'half-even'), 2);
    assert.strictEqual(roundTo(3.5, 0, 'half-even'), 4);
    assert.strictEqual(roundTo(1.25, 1, 'bankers'), 1.2);
    assert.strictEqual(roundTo(1.35, 1, 'bankers'), 1.4);
  });

  it('should throw TypeError for invalid inputs', () => {
    assert.throws(() => roundTo('1.005'), { name: 'TypeError' });
    assert.throws(() => roundTo(NaN), { name: 'TypeError' });
    assert.throws(() => roundTo(Infinity), { name: 'TypeError' });
    assert.throws(() => roundTo(1.5, -1), { name: 'TypeError' });
    assert.throws(() => roundTo(1.5, 1.5), { name: 'TypeError' });
  });
});