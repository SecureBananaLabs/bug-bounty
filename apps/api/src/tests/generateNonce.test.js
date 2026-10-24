import test from 'node:test';
import assert from 'node:assert/strict';
import { generateNonce } from '../utils/generateNonce.js';

test('generateNonce generates valid hex string of requested length', () => {
  const nonce16 = generateNonce(16, 'hex');
  assert.equal(nonce16.length, 32); // 16 bytes = 32 hex chars
  assert.match(nonce16, /^[0-9a-f]{32}$/);

  const nonce32 = generateNonce(32, 'hex');
  assert.equal(nonce32.length, 64); // 32 bytes = 64 hex chars
  assert.match(nonce32, /^[0-9a-f]{64}$/);
});

test('generateNonce supports base64url encoding', () => {
  const nonceB64 = generateNonce(16, 'base64url');
  assert.ok(nonceB64.length >= 20);
  assert.match(nonceB64, /^[A-Za-z0-9_-]+$/);
});

test('generateNonce generates unique nonces across sequential invocations', () => {
  const nonces = new Set();
  for (let i = 0; i < 50; i++) {
    nonces.add(generateNonce(16));
  }
  assert.equal(nonces.size, 50);
});

test('generateNonce enforces bounds (min 4, max 256)', () => {
  const minNonce = generateNonce(1); // Clamped to 4 bytes
  assert.equal(minNonce.length, 8);

  const maxNonce = generateNonce(1000); // Clamped to 256 bytes
  assert.equal(maxNonce.length, 512);
});

test('generateNonce defensively handles invalid types and falls back to defaults', () => {
  const fallbackNonce = generateNonce(null, null);
  assert.equal(fallbackNonce.length, 32); // 16 bytes hex

  const invalidNonce = generateNonce('not-a-number', 'unsupported-encoding');
  assert.equal(invalidNonce.length, 32);
});
