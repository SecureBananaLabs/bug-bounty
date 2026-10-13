import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSecureToken } from '../utils/randomToken.js';

describe('Cryptographic Random Token Generator Utility', () => {
  it('generates hex token with default 32 bytes (64 chars)', () => {
    const token = generateSecureToken();
    assert.equal(typeof token, 'string');
    assert.equal(token.length, 64);
    assert.ok(/^[0-9a-f]{64}$/.test(token));
  });

  it('generates base64 and base64url encoded tokens', () => {
    const b64 = generateSecureToken(16, 'base64');
    const b64url = generateSecureToken(16, 'base64url');
    assert.ok(b64.length > 0);
    assert.ok(b64url.length > 0);
    assert.ok(!b64url.includes('+') && !b64url.includes('/'));
  });

  it('generates alphanumeric tokens strictly containing valid alphabet chars', () => {
    const alpha = generateSecureToken(24, 'alphanumeric');
    assert.equal(alpha.length, 24);
    assert.ok(/^[A-Za-z0-9]{24}$/.test(alpha));
  });

  it('generates unique tokens across successive invocations', () => {
    const t1 = generateSecureToken(16);
    const t2 = generateSecureToken(16);
    assert.notEqual(t1, t2);
  });
});
