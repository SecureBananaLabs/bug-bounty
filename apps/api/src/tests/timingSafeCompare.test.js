import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { timingSafeEqual } from '../utils/timingSafeCompare.js';

describe('Constant-Time String Comparison Utility', () => {
  it('returns true for identical strings', () => {
    assert.equal(timingSafeEqual('super_secret_token_123', 'super_secret_token_123'), true);
  });

  it('returns false for mismatched strings with same length', () => {
    assert.equal(timingSafeEqual('super_secret_token_123', 'super_secret_token_124'), false);
  });

  it('returns false for mismatched strings with different lengths', () => {
    assert.equal(timingSafeEqual('short', 'longer_string_here'), false);
  });

  it('correctly compares Buffer instances', () => {
    const buf1 = Buffer.from('hello world');
    const buf2 = Buffer.from('hello world');
    const buf3 = Buffer.from('hello earth');
    assert.equal(timingSafeEqual(buf1, buf2), true);
    assert.equal(timingSafeEqual(buf1, buf3), false);
  });

  it('returns false safely when either input is null or undefined', () => {
    assert.equal(timingSafeEqual(null, 'secret'), false);
    assert.equal(timingSafeEqual('secret', undefined), false);
    assert.equal(timingSafeEqual(null, null), false);
  });
});
