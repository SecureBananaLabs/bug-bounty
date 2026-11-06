/**
 * @file timingSafeCompare.test.js
 * Unit tests for timingSafeEqual utility.
 */

import assert from 'assert';
import { timingSafeEqual, safeCompare } from '../utils/timingSafeCompare.js';

function runTests() {
  console.log('Running timingSafeCompare unit tests...');

  // Test 1: Identical strings match
  {
    assert.strictEqual(timingSafeEqual('super-secret-token-123', 'super-secret-token-123'), true);
    assert.strictEqual(safeCompare('api_key_xyz987', 'api_key_xyz987'), true);
    assert.strictEqual(timingSafeEqual('', ''), true);
    console.log('✔ Test 1 passed: Identical strings match');
  }

  // Test 2: Different strings return false without throwing
  {
    assert.strictEqual(timingSafeEqual('secret_a', 'secret_b'), false);
    assert.strictEqual(timingSafeEqual('password123', 'password124'), false);
    console.log('✔ Test 2 passed: Different strings return false');
  }

  // Test 3: Strings of different lengths safely compare without throwing RangeError
  {
    assert.strictEqual(timingSafeEqual('short', 'much-longer-secret-token'), false);
    assert.strictEqual(timingSafeEqual('much-longer-secret-token', 'short'), false);
    assert.strictEqual(timingSafeEqual('prefix', 'prefix_extended'), false);
    console.log('✔ Test 3 passed: Different length inputs handled safely');
  }

  // Test 4: Buffer support
  {
    const buf1 = Buffer.from('my-binary-secret', 'utf8');
    const buf2 = Buffer.from('my-binary-secret', 'utf8');
    const buf3 = Buffer.from('different-binary', 'utf8');

    assert.strictEqual(timingSafeEqual(buf1, buf2), true);
    assert.strictEqual(timingSafeEqual(buf1, buf3), false);
    console.log('✔ Test 4 passed: Buffer inputs supported');
  }

  // Test 5: Non-string and null/undefined inputs return false
  {
    assert.strictEqual(timingSafeEqual(null, 'secret'), false);
    assert.strictEqual(timingSafeEqual('secret', null), false);
    assert.strictEqual(timingSafeEqual(undefined, undefined), false);
    assert.strictEqual(timingSafeEqual({}, {}), false);
    assert.strictEqual(timingSafeEqual(12345, 12345), false);
    console.log('✔ Test 5 passed: Non-string inputs return false safely');
  }

  console.log('All timingSafeCompare tests passed successfully!');
}

runTests();
