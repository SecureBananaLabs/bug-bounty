import test from 'node:test';
import assert from 'node:assert/strict';
import { maskEmail } from '../utils/maskEmail.js';

test('maskEmail correctly masks standard email addresses', () => {
  assert.equal(maskEmail('john.doe@example.com'), 'j***e@example.com');
  assert.equal(maskEmail('alice@test.org'), 'a***e@test.org');
});

test('maskEmail handles short local parts properly', () => {
  assert.equal(maskEmail('a@domain.com'), '*@domain.com');
  assert.equal(maskEmail('ab@domain.com'), 'a*@domain.com');
  assert.equal(maskEmail('abc@domain.com'), 'a***c@domain.com');
});

test('maskEmail trims whitespace around email', () => {
  assert.equal(maskEmail('   user@provider.io   '), 'u***r@provider.io');
});

test('maskEmail rejects invalid email structures and non-strings defensively', () => {
  assert.equal(maskEmail('invalid-email'), '');
  assert.equal(maskEmail('foo@bar@baz.com'), '');
  assert.equal(maskEmail('@domain.com'), '');
  assert.equal(maskEmail('user@nodomain'), '');
  assert.equal(maskEmail(null), '');
  assert.equal(maskEmail(undefined), '');
  assert.equal(maskEmail(12345), '');
  assert.equal(maskEmail({}), '');
});
