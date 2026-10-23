import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSecureToken, generateFromAlphabet } from '../utils/randomToken.js';

describe('Cryptographically Secure Random Token Generator (generateSecureToken)', () => {
  it('generates a 64-character hex token by default (32 random bytes)', () => {
    const token = generateSecureToken();
    assert.equal(token.length, 64);
    assert.match(token, /^[0-9a-f]{64}$/);
  });

  it('supports custom byte lengths with hex, base64, and base64url encodings', () => {
    const hex16 = generateSecureToken(16, 'hex');
    assert.equal(hex16.length, 32);
    assert.match(hex16, /^[0-9a-f]{32}$/);

    const b64url = generateSecureToken(24, 'base64url');
    assert.equal(b64url.length, 32);
    assert.match(b64url, /^[A-Za-z0-9_-]+$/);

    const b64 = generateSecureToken(12, 'base64');
    assert.equal(Buffer.from(b64, 'base64').length, 12);
  });

  it('supports alphanumeric and custom character alphabets without bias', () => {
    const alpha = generateSecureToken(20, 'alphanumeric');
    assert.equal(alpha.length, 20);
    assert.match(alpha, /^[A-Za-z0-9]{20}$/);

    const custom = generateSecureToken(10, { alphabet: 'ABCDEF123456' });
    assert.equal(custom.length, 10);
    assert.match(custom, /^[ABCDEF123456]{10}$/);

    const directAlpha = generateFromAlphabet(8, '01');
    assert.equal(directAlpha.length, 8);
    assert.match(directAlpha, /^[01]{8}$/);
  });

  it('produces unique high-entropy tokens across consecutive calls', () => {
    const seen = new Set();
    for (let i = 0; i < 50; i++) {
      seen.add(generateSecureToken(16, 'hex'));
    }
    assert.equal(seen.size, 50);
  });

  it('throws RangeError for invalid byte lengths', () => {
    assert.throws(() => generateSecureToken(0), RangeError);
    assert.throws(() => generateSecureToken(-8), RangeError);
    assert.throws(() => generateSecureToken(1.5), RangeError);
    assert.throws(() => generateSecureToken(10000), RangeError);
  });
});
