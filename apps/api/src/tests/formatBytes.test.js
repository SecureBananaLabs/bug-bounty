import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes } from '../utils/formatBytes.js';

describe('Human-Readable Byte Formatter Utility', () => {
  it('formats 0 bytes correctly', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(-10), '0 B');
  });

  it('formats standard byte thresholds', () => {
    assert.equal(formatBytes(500), '500 B');
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(1048576), '1 MB');
    assert.equal(formatBytes(1073741824), '1 GB');
  });

  it('formats decimal precision correctly', () => {
    assert.equal(formatBytes(1572864, 1), '1.5 MB');
    assert.equal(formatBytes(1572864, 0), '2 MB');
  });

  it('handles non-numeric and NaN values gracefully', () => {
    assert.equal(formatBytes('invalid'), '0 B');
    assert.equal(formatBytes(NaN), '0 B');
    assert.equal(formatBytes(null), '0 B');
  });
});
