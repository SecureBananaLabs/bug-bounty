import { describe, it, expect } from 'vitest';
import { formatBytes } from '../utils/formatBytes.js';

describe('formatBytes', () => {
  it('should return "0 B" for zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('should return "0 B" for negative values', () => {
    expect(formatBytes(-100)).toBe('0 B');
  });

  it('should return "0 B" for NaN/Infinity', () => {
    expect(formatBytes(NaN)).toBe('0 B');
    expect(formatBytes(Infinity)).toBe('0 B');
  });

  it('should format bytes correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1536)).toBe('1.50 KB');
    expect(formatBytes(1048576)).toBe('1.00 MB');
    expect(formatBytes(1073741824)).toBe('1.00 GB');
    expect(formatBytes(1099511627776)).toBe('1.00 TB');
  });

  it('should respect custom decimal places', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB');
    expect(formatBytes(1536, 4)).toBe('1.5000 KB');
  });

  it('should handle edge case of exactly 1024', () => {
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1.00 KB');
  });

  it('should not exceed TB unit for very large numbers', () => {
    const result = formatBytes(1099511627776 * 1024);
    expect(result).toContain('TB');
  });
});
