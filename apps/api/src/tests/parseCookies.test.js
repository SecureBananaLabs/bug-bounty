import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCookies } from '../utils/parseCookies.js';

test('parseCookies correctly parses standard cookie headers', () => {
  const header = 'sessionId=abc123xyz; theme=dark; user=john';
  const cookies = parseCookies(header);
  assert.equal(cookies.sessionId, 'abc123xyz');
  assert.equal(cookies.theme, 'dark');
  assert.equal(cookies.user, 'john');
});

test('parseCookies unquotes quoted values and decodes URI components', () => {
  const header = 'token="hello%20world"; tracking=123';
  const cookies = parseCookies(header);
  assert.equal(cookies.token, 'hello world');
  assert.equal(cookies.tracking, '123');
});

test('parseCookies safely ignores prototype pollution keys', () => {
  const header = '__proto__=evil; constructor=malicious; prototype=bad; normal=good';
  const cookies = parseCookies(header);
  assert.equal(cookies.__proto__, undefined);
  assert.equal(cookies.constructor, undefined);
  assert.equal(cookies.prototype, undefined);
  assert.equal(cookies.normal, 'good');
});

test('parseCookies handles malformed pairs gracefully', () => {
  const header = 'keyWithoutVal; =valWithoutKey; valid=1; ;;;';
  const cookies = parseCookies(header);
  assert.equal(cookies.valid, '1');
  assert.equal(cookies.keyWithoutVal, undefined);
});

test('parseCookies defensively handles non-string and empty inputs', () => {
  assert.deepEqual(parseCookies(null), Object.create(null));
  assert.deepEqual(parseCookies(undefined), Object.create(null));
  assert.deepEqual(parseCookies(12345), Object.create(null));
  assert.deepEqual(parseCookies({}), Object.create(null));
  assert.deepEqual(parseCookies(''), Object.create(null));
  assert.deepEqual(parseCookies('   '), Object.create(null));
});
