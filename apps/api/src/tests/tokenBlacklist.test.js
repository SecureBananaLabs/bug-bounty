/**
 * @file tokenBlacklist.test.js
 * Unit tests for tokenBlacklistService.
 */

import assert from 'assert';
import {
  revokeToken,
  isTokenRevoked,
  getBlacklistSize,
  clearBlacklist,
} from '../services/tokenBlacklistService.js';

function runTests() {
  console.log('Running tokenBlacklist unit tests...');

  clearBlacklist();

  // Test 1: Empty and invalid inputs
  {
    assert.strictEqual(revokeToken(''), false);
    assert.strictEqual(revokeToken(null), false);
    assert.strictEqual(revokeToken(undefined), false);
    assert.strictEqual(isTokenRevoked(''), false);
    assert.strictEqual(isTokenRevoked(null), false);
    assert.strictEqual(isTokenRevoked('random_unrevoked_token'), false);
    assert.strictEqual(getBlacklistSize(), 0);
    console.log('✔ Test 1 passed: Invalid and missing token handling');
  }

  // Test 2: Standard token revocation and check
  {
    const token1 = 'jwt.header.payload1.signature';
    const token2 = 'jwt.header.payload2.signature';

    assert.strictEqual(revokeToken(token1), true);
    assert.strictEqual(isTokenRevoked(token1), true);
    assert.strictEqual(isTokenRevoked(token2), false);
    assert.strictEqual(getBlacklistSize(), 1);
    console.log('✔ Test 2 passed: Standard token revocation');
  }

  // Test 3: JWT numeric exp in seconds conversion
  {
    const jwtToken = 'jwt.exp.in.seconds';
    const futureSeconds = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future

    assert.strictEqual(revokeToken(jwtToken, futureSeconds), true);
    assert.strictEqual(isTokenRevoked(jwtToken), true);
    console.log('✔ Test 3 passed: Seconds timestamp handling for JWT exp claim');
  }

  // Test 4: Expired token eviction (TTL)
  {
    const expiredToken = 'expired.jwt.token';
    const pastTimestamp = Date.now() - 5000; // 5 seconds ago

    // Revoking an already expired token returns false
    assert.strictEqual(revokeToken(expiredToken, pastTimestamp), false);
    assert.strictEqual(isTokenRevoked(expiredToken), false);

    // Test token expiring on lookup
    const shortLivedToken = 'short.lived.token';
    assert.strictEqual(revokeToken(shortLivedToken, Date.now() + 50), true);
    assert.strictEqual(isTokenRevoked(shortLivedToken), true);

    // Wait 60ms for TTL expiry
    const start = Date.now();
    while (Date.now() - start < 60) {}

    assert.strictEqual(isTokenRevoked(shortLivedToken), false);
    console.log('✔ Test 4 passed: TTL expiration and automatic eviction');
  }

  // Test 5: Blacklist reset / clear
  {
    clearBlacklist();
    assert.strictEqual(getBlacklistSize(), 0);
    console.log('✔ Test 5 passed: Blacklist clearing');
  }

  console.log('All tokenBlacklist tests passed successfully!');
}

runTests();
