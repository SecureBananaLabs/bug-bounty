import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex } from '../utils/escapeRegex.js';

test('escapeRegex escapes all standard regex metacharacters', () => {
  const metachars = '-[]/{}()*+?.\\^$|';
  const escaped = escapeRegex(metachars);
  assert.equal(escaped, '\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|');
  // Verify it can safely compile into a RegExp matching the literal string
  const re = new RegExp(escaped);
  assert.equal(re.test(metachars), true);
});

test('escapeRegex handles strings with mixed alphanumeric and symbols', () => {
  const query = 'user.name[0] (test)';
  const escaped = escapeRegex(query);
  assert.equal(escaped, 'user\\.name\\[0\\] \\(test\\)');
  assert.equal(new RegExp(escaped).test(query), true);
});

test('escapeRegex leaves regular alphanumeric strings untouched', () => {
  assert.equal(escapeRegex('hello world 123'), 'hello world 123');
});

test('escapeRegex defensively handles non-string and empty inputs', () => {
  assert.equal(escapeRegex(null), '');
  assert.equal(escapeRegex(undefined), '');
  assert.equal(escapeRegex(12345), '');
  assert.equal(escapeRegex({}), '');
  assert.equal(escapeRegex(''), '');
});
