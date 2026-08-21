import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clamp } from '../utils/clamp.js';

describe('Safe Numeric Clamping Helper Utility', () => {
  it('returns value directly when within range', () => {
    assert.equal(clamp(50, 0, 100), 50);
  });

  it('clamps lower bound when value is below minimum', () => {
    assert.equal(clamp(-10, 0, 100), 0);
  });

  it('clamps upper bound when value exceeds maximum', () => {
    assert.equal(clamp(150, 0, 100), 100);
  });

  it('handles inverted min and max arguments gracefully', () => {
    assert.equal(clamp(150, 100, 0), 100);
    assert.equal(clamp(-10, 100, 0), 0);
  });

  it('falls back to safe default value on NaN or non-numeric inputs', () => {
    assert.equal(clamp('invalid', 0, 100, 25), 25);
    assert.equal(clamp(NaN, 10, 50), 10);
    assert.equal(clamp(null, 0, 10), 0);
  });
});
