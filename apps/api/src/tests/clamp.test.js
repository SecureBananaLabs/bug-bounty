import { describe, it } from 'node:test';
import assert from 'node:assert';
import { clamp, inRange } from '../utils/clamp.js';

describe('clamp Utility', () => {
  it('should clamp numbers that fall outside lower or upper bounds', () => {
    assert.strictEqual(clamp(15, 0, 10), 10);
    assert.strictEqual(clamp(-5, 0, 10), 0);
  });

  it('should return the original number when within bounds', () => {
    assert.strictEqual(clamp(5, 0, 10), 5);
    assert.strictEqual(clamp(0, 0, 10), 0);
    assert.strictEqual(clamp(10, 0, 10), 10);
  });

  it('should handle negative bounds and inverted min/max order gracefully', () => {
    assert.strictEqual(clamp(-15, -10, -5), -10);
    assert.strictEqual(clamp(0, -10, -5), -5);
    assert.strictEqual(clamp(5, 10, 0), 5); // inverted order
    assert.strictEqual(clamp(15, 10, 0), 10);
  });

  it('should correctly check ranges with inRange', () => {
    assert.strictEqual(inRange(5, 0, 10), true);
    assert.strictEqual(inRange(0, 0, 10), true);
    assert.strictEqual(inRange(10, 0, 10), true);
    assert.strictEqual(inRange(11, 0, 10), false);
    assert.strictEqual(inRange(-1, 0, 10), false);
    assert.strictEqual(inRange(5, 10, 0), true); // inverted
  });

  it('should throw TypeError for invalid/non-finite inputs', () => {
    assert.throws(() => clamp('5', 0, 10), { name: 'TypeError' });
    assert.throws(() => clamp(5, '0', 10), { name: 'TypeError' });
    assert.throws(() => clamp(5, 0, '10'), { name: 'TypeError' });
    assert.throws(() => clamp(NaN, 0, 10), { name: 'TypeError' });
    assert.throws(() => clamp(5, 0, Infinity), { name: 'TypeError' });
    assert.throws(() => inRange(null, 0, 10), { name: 'TypeError' });
  });
});