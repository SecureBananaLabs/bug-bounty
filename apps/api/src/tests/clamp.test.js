const { clamp } = require('../utils/clamp');

describe('clamp', () => {
  describe('basic clamping', () => {
    test('returns value within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    test('clamps below minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, 0, 10)).toBe(0);
    });

    test('clamps above maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, 0, 10)).toBe(10);
    });
  });

  describe('inverted bounds', () => {
    test('handles min > max by swapping', () => {
      expect(clamp(5, 10, 0)).toBe(5);
      expect(clamp(-5, 10, 0)).toBe(0);
      expect(clamp(15, 10, 0)).toBe(10);
    });
  });

  describe('NaN handling', () => {
    test('returns defaultValue for NaN input', () => {
      expect(clamp(NaN, 0, 10)).toBe(0);
      expect(clamp(NaN, 0, 10, 42)).toBe(42);
    });

    test('returns defaultValue for NaN bounds', () => {
      expect(clamp(5, NaN, 10)).toBe(0);
      expect(clamp(5, 0, NaN)).toBe(0);
      expect(clamp(5, NaN, NaN, 7)).toBe(7);
    });
  });

  describe('Infinity handling', () => {
    test('returns defaultValue for Infinity input', () => {
      expect(clamp(Infinity, 0, 10)).toBe(0);
      expect(clamp(-Infinity, 0, 10)).toBe(0);
      expect(clamp(Infinity, 0, 10, 99)).toBe(99);
    });

    test('returns defaultValue for Infinity bounds', () => {
      expect(clamp(5, Infinity, 10)).toBe(0);
      expect(clamp(5, 0, -Infinity)).toBe(0);
      expect(clamp(5, Infinity, -Infinity, 88)).toBe(88);
    });
  });

  describe('defaultValue parameter', () => {
    test('uses custom defaultValue', () => {
      expect(clamp(NaN, 0, 10, -1)).toBe(-1);
      expect(clamp(Infinity, 0, 10, 100)).toBe(100);
    });

    test('defaults to 0 when not provided', () => {
      expect(clamp(NaN, 0, 10)).toBe(0);
      expect(clamp(Infinity, 0, 10)).toBe(0);
    });
  });

  describe('edge cases', () => {
    test('handles negative bounds', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    test('handles decimal values', () => {
      expect(clamp(3.14, 0, 5)).toBe(3.14);
      expect(clamp(3.14, 0, 3)).toBe(3);
      expect(clamp(-1.5, 0, 5)).toBe(0);
    });

    test('handles equal min and max', () => {
      expect(clamp(5, 10, 10)).toBe(10);
      expect(clamp(10, 10, 10)).toBe(10);
      expect(clamp(15, 10, 10)).toBe(10);
    });

    test('handles zero bounds', () => {
      expect(clamp(0, 0, 0)).toBe(0);
      expect(clamp(5, 0, 0)).toBe(0);
      expect(clamp(-5, 0, 0)).toBe(0);
    });
  });
});
