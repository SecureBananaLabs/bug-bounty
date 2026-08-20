import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roundTo } from '../utils/roundTo.js';

describe('Accurate Decimal Precision Rounding Utility (roundTo)', () => {
  it('correctly rounds problematic binary floating-point numbers', () => {
    assert.equal(roundTo(1.005, 2), 1.01);
    assert.equal(roundTo(1.055, 2), 1.06);
    assert.equal(roundTo(35.855, 2), 35.86);
  });

  it('rounds to integer when precision is 0 or omitted', () => {
    assert.equal(roundTo(4.5), 5);
    assert.equal(roundTo(4.4), 4);
    assert.equal(roundTo(4.5, 0), 5);
  });

  it('supports negative precision for rounding to tens or hundreds', () => {
    assert.equal(roundTo(1250, -2), 1300);
    assert.equal(roundTo(1249, -2), 1200);
  });

  it('handles NaN, Infinity, and invalid types cleanly', () => {
    assert.ok(Number.isNaN(roundTo(NaN)));
    assert.ok(Number.isNaN(roundTo(Infinity)));
    assert.ok(Number.isNaN(roundTo('invalid')));
  });
});
