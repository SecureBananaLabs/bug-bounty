const { formatBytes } = require('../utils/formatBytes');

describe('formatBytes', () => {
  test('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(1099511627776)).toBe('1 TB');
  });

  test('respects decimal precision', () => {
    expect(formatBytes(1536, 0)).toBe('1 KB');
    expect(formatBytes(1536, 3)).toBe('1.5 KB');
  });

  test('handles very large numbers', () => {
    expect(formatBytes(1125899906842624)).toBe('1 PB');
  });
});