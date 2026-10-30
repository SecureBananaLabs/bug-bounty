import test from 'node:test';
import assert from 'node:assert/strict';
import { isUUID } from '../utils/isUUID.js';

test('isUUID validates standard canonical UUID v4', () => {
  assert.equal(isUUID('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'), true);
  assert.equal(isUUID('9B1DEB4D-3B7D-4BAD-9BDD-2B0D7B3DCB6D'), true); // case-insensitive
  assert.equal(isUUID('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', 4), true);
  assert.equal(isUUID('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', 1), false);
});

test('isUUID validates standard canonical UUID v1', () => {
  const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  assert.equal(isUUID(uuidV1), true);
  assert.equal(isUUID(uuidV1, 1), true);
  assert.equal(isUUID(uuidV1, 4), false);
});

test('isUUID validates standard canonical UUID v5', () => {
  const uuidV5 = '886313e1-3b8a-5372-9b90-0c9aee199e5d';
  assert.equal(isUUID(uuidV5), true);
  assert.equal(isUUID(uuidV5, 5), true);
  assert.equal(isUUID(uuidV5, 4), false);
});

test('isUUID rejects invalid characters, formats, and lengths', () => {
  assert.equal(isUUID('not-a-uuid'), false);
  assert.equal(isUUID('9b1deb4d3b7d4bad9bdd2b0d7b3dcb6d'), false); // missing hyphens
  assert.equal(isUUID('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d-extra'), false); // too long
  assert.equal(isUUID('9b1deb4d-3b7d-6bad-9bdd-2b0d7b3dcb6d'), false); // invalid version 6
  assert.equal(isUUID('9b1deb4d-3b7d-4bad-zbdd-2b0d7b3dcb6d'), false); // invalid hex char 'z'
});

test('isUUID defensively handles non-string and empty inputs', () => {
  assert.equal(isUUID(null), false);
  assert.equal(isUUID(undefined), false);
  assert.equal(isUUID(12345), false);
  assert.equal(isUUID({}), false);
  assert.equal(isUUID(''), false);
  assert.equal(isUUID('   '), false);
});
