/**
 * @file randomToken.test.js
 * Unit tests for generateSecureToken and generateCustomToken utilities.
 */

import assert from 'assert';
import { generateSecureToken, generateCustomToken } from '../utils/randomToken.js';

function runTests() {
  console.log('Running randomToken unit tests...');

  // Test 1: Hex token generation and length
  {
    const token = generateSecureToken(16, 'hex');
    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.length, 32); // 16 bytes = 32 hex chars
    assert.strictEqual(/^[0-9a-f]{32}$/.test(token), true);
    console.log('✔ Test 1 passed: Hex token generation');
  }

  // Test 2: Base64 and Base64url encodings
  {
    const b64 = generateSecureToken(24, 'base64');
    const b64url = generateSecureToken(24, 'base64url');
    assert.strictEqual(typeof b64, 'string');
    assert.strictEqual(typeof b64url, 'string');
    assert.strictEqual(/^[A-Za-z0-9+/=]+$/.test(b64), true);
    assert.strictEqual(/^[A-Za-z0-9_-]+$/.test(b64url), true);
    console.log('✔ Test 2 passed: Base64 and Base64url token formats');
  }

  // Test 3: Custom alphabet token generation
  {
    const hexAlphabet = '0123456789abcdef';
    const hexToken = generateCustomToken(20, hexAlphabet);
    assert.strictEqual(hexToken.length, 20);
    for (const char of hexToken) {
      assert.strictEqual(hexAlphabet.includes(char), true);
    }

    const digitsOnly = generateCustomToken(6, '0123456789');
    assert.strictEqual(digitsOnly.length, 6);
    assert.strictEqual(/^\d{6}$/.test(digitsOnly), true);
    console.log('✔ Test 3 passed: Custom alphabet and PIN generation');
  }

  // Test 4: Uniqueness and randomness across iterations
  {
    const set = new Set();
    for (let i = 0; i < 50; i++) {
      const t = generateSecureToken(16);
      assert.strictEqual(set.has(t), false);
      set.add(t);
    }
    assert.strictEqual(set.size, 50);
    console.log('✔ Test 4 passed: Uniqueness across multiple generations');
  }

  // Test 5: Invalid arguments error handling
  {
    assert.throws(() => generateSecureToken(-5), RangeError);
    assert.throws(() => generateSecureToken(0), RangeError);
    assert.throws(() => generateSecureToken(16, 'invalid_encoding'), TypeError);
    assert.throws(() => generateCustomToken(10, 'A'), TypeError);
    console.log('✔ Test 5 passed: Error validation on invalid parameters');
  }

  console.log('All randomToken tests passed successfully!');
}

runTests();
