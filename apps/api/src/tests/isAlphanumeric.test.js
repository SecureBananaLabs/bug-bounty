import test from 'node:test';
import assert from 'node:assert/strict';
import { isAlphanumeric } from '../utils/isAlphanumeric.js';

test('isAlphanumeric validates standard alphanumeric strings without options', () => {
  assert.equal(isAlphanumeric('abc'), true);
  assert.equal(isAlphanumeric('ABC'), true);
  assert.equal(isAlphanumeric('1234567890'), true);
  assert.equal(isAlphanumeric('AlphaNumeric123'), true);
  assert.equal(isAlphanumeric(''), false);
});

test('isAlphanumeric handles allowSpaces option correctly', () => {
  const strWithSpaces = 'Hello World 2026';
  assert.equal(isAlphanumeric(strWithSpaces), false);
  assert.equal(isAlphanumeric(strWithSpaces, { allowSpaces: false }), false);
  assert.equal(isAlphanumeric(strWithSpaces, { allowSpaces: true }), true);
});

test('isAlphanumeric handles allowDashes option correctly', () => {
  const strWithDashes = 'order-id-98765';
  assert.equal(isAlphanumeric(strWithDashes), false);
  assert.equal(isAlphanumeric(strWithDashes, { allowDashes: false }), false);
  assert.equal(isAlphanumeric(strWithDashes, { allowDashes: true }), true);
});

test('isAlphanumeric handles allowUnderscores option correctly', () => {
  const strWithUnderscores = 'user_session_token_123';
  assert.equal(isAlphanumeric(strWithUnderscores), false);
  assert.equal(isAlphanumeric(strWithUnderscores, { allowUnderscores: false }), false);
  assert.equal(isAlphanumeric(strWithUnderscores, { allowUnderscores: true }), true);
});

test('isAlphanumeric supports combined options simultaneously', () => {
  const complexStr = 'Invoice-101 for_user test-run';
  assert.equal(isAlphanumeric(complexStr), false);
  assert.equal(isAlphanumeric(complexStr, {
    allowSpaces: true,
    allowDashes: true,
    allowUnderscores: true
  }), true);
});

test('isAlphanumeric rejects invalid symbols and special characters', () => {
  assert.equal(isAlphanumeric('hello!world'), false);
  assert.equal(isAlphanumeric('user@example.com'), false);
  assert.equal(isAlphanumeric('price$100'), false);
  assert.equal(isAlphanumeric('calc%value'), false);
  assert.equal(isAlphanumeric('injection<script>', {
    allowSpaces: true,
    allowDashes: true,
    allowUnderscores: true
  }), false);
});

test('isAlphanumeric defensively handles non-string and empty inputs', () => {
  assert.equal(isAlphanumeric(null), false);
  assert.equal(isAlphanumeric(undefined), false);
  assert.equal(isAlphanumeric(''), false);
  assert.equal(isAlphanumeric(12345), false);
  assert.equal(isAlphanumeric({}), false);
  assert.equal(isAlphanumeric([]), false);
  assert.equal(isAlphanumeric(true), false);
  assert.equal(isAlphanumeric(Symbol('test')), false);
});
