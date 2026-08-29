import { describe, it, expect } from 'vitest';
import timingSafeEqual from '../utils/timingSafeCompare.js';

describe('timingSafeCompare utility', () => {
  it('should return true for identical strings', () => {
    expect(timingSafeEqual('secret123', 'secret123')).toBe(true);
  });

  it('should return false for different strings of same length', () => {
    expect(timingSafeEqual('secret123', 'secret456')).toBe(false);
  });

  it('should return false for strings of different lengths', () => {
    expect(timingSafeEqual('short', 'muchlongersecret')).toBe(false);
  });

  it('should return false for null or undefined inputs', () => {
    expect(timingSafeEqual(null, 'secret')).toBe(false);
    expect(timingSafeEqual('secret', undefined)).toBe(false);
  });

  it('should handle Buffer inputs correctly', () => {
    const bufA = Buffer.from('mysecret');
    const bufB = Buffer.from('mysecret');
    expect(timingSafeEqual(bufA, bufB)).toBe(true);
  });
});
