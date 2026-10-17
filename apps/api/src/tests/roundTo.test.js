import { describe, it, expect } from 'vitest';
import { roundTo } from '../utils/roundTo.js';

describe('roundTo', () => {
  it('should round to integer by default (precision=0)', () => {
    expect(roundTo(4.5)).toBe(5);
    expect(roundTo(4.4)).toBe(4);
  });

  it('should handle positive precision (decimal places)', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(1.2345, 3)).toBe(1.235);
    expect(roundTo(0.999, 2)).toBe(1); // 0.999 → 1.00 → 1
    expect(roundTo(1.234567, 4)).toBe(1.2346);
  });

  it('should handle negative precision (round to tens/hundreds)', () => {
    expect(roundTo(155, -1)).toBe(160);
    expect(roundTo(149, -1)).toBe(150);
    expect(roundTo(2500, -2)).toBe(2500);
    expect(roundTo(2550, -2)).toBe(2600);
  });

  it('should return NaN for non-finite values', () => {
    expect(roundTo(NaN)).toBeNaN();
    expect(roundTo(Infinity)).toBeNaN();
    expect(roundTo(-Infinity)).toBeNaN();
  });

  it('should clamp extreme precision values', () => {
    // Should not throw or produce Infinity
    const result = roundTo(1.005, 50);
    expect(Number.isFinite(result)).toBe(true);
    const result2 = roundTo(1.005, -50);
    expect(Number.isFinite(result2)).toBe(true);
  });

  it('should handle zero correctly', () => {
    expect(roundTo(0)).toBe(0);
    expect(roundTo(0, 4)).toBe(0);
  });

  it('should handle negative numbers', () => {
    // Note: Math.round rounds toward +Infinity, so -4.5 → -4
    expect(roundTo(-1.234, 2)).toBe(-1.23);
    expect(roundTo(-4.5)).toBe(-4); // Math.round rounds toward +Inf
  });
});
