import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roundTo } from '../utils/roundTo.js';

describe('Accurate Decimal Precision Rounding Utility (roundTo)', () => {
  it('correctly rounds problematic binary floating-point numbers (e.g. 1.005)', () => {
    assert.equal(roundTo(1.005, 2), 1.01);
    assert.equal(roundTo(1.055, 2), 1.06);
    assert.equal(roundTo(35.855, 2), 35.86);
    assert.equal(roundTo(-1.005, 2), -1.01);
  });

  it('rounds to nearest integer when precision is 0 or omitted', () => {
    assert.equal(roundTo(4.5), 5);
    assert.equal(roundTo(4.4), 4);
    assert.equal(roundTo(-0.1, 0), 0);
  });

  it('supports negative precision for rounding to tens, hundreds, or thousands', () => {
    assert.equal(roundTo(1234, -1), 1230);
    assert.equal(roundTo(1250, -2), 1300);
    assert.equal(roundTo(1500, -3), 2000);
  });

  it('returns NaN for non-numeric or non-finite inputs', () => {
    assert.equal(Number.isNaN(roundTo(NaN, 2)), true);
    assert.equal(Number.isNaN(roundTo(Infinity, 2)), true);
    assert.equal(Number.isNaN(roundTo('1.005', 2)), true);
    assert.equal(Number.isNaN(roundTo(null, 2)), true);
  });
});
