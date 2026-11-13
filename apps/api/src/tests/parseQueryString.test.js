import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQueryString } from '../utils/parseQueryString.js';

test('parseQueryString parses standard key-value pairs', () => {
  const result = parseQueryString('name=alice&role=admin');
  assert.deepEqual(result, { name: 'alice', role: 'admin' });
});

test('parseQueryString strips leading ? and #', () => {
  assert.deepEqual(parseQueryString('?page=1&limit=20'), { page: 1, limit: 20 });
  assert.deepEqual(parseQueryString('#tab=overview&filter=active'), { tab: 'overview', filter: 'active' });
});

test('parseQueryString decodes URI components and plus signs as spaces', () => {
  const result = parseQueryString('greeting=hello+world&symbol=%24100%20USDC');
  assert.deepEqual(result, { greeting: 'hello world', symbol: '$100 USDC' });
});

test('parseQueryString safely handles malformed percent encoding without throwing', () => {
  const result = parseQueryString('tag=safe%20string&broken=%E0%A4%Z');
  assert.equal(result.tag, 'safe string');
  assert.ok(result.broken.includes('%'));
});

test('parseQueryString parses booleans and numbers automatically', () => {
  const result = parseQueryString('enabled=true&archived=false&count=42&ratio=3.1415');
  assert.deepEqual(result, {
    enabled: true,
    archived: false,
    count: 42,
    ratio: 3.1415
  });
});

test('parseQueryString preserves string types when casting options are disabled', () => {
  const result = parseQueryString('enabled=true&count=42', {
    parseBooleans: false,
    parseNumbers: false
  });
  assert.deepEqual(result, { enabled: 'true', count: '42' });
});

test('parseQueryString accumulates duplicate keys into arrays', () => {
  const result = parseQueryString('category=security&category=web3&category=audit');
  assert.deepEqual(result, {
    category: ['security', 'web3', 'audit']
  });
});

test('parseQueryString handles valueless keys as flags', () => {
  const result = parseQueryString('verbose&debug=true');
  assert.deepEqual(result, { verbose: true, debug: true });
});

test('parseQueryString returns empty object for non-string or empty inputs', () => {
  assert.deepEqual(parseQueryString(''), {});
  assert.deepEqual(parseQueryString('   '), {});
  assert.deepEqual(parseQueryString(null), {});
  assert.deepEqual(parseQueryString(undefined), {});
  assert.deepEqual(parseQueryString(12345), {});
});

test('parseQueryString defends against prototype pollution', () => {
  const query = '__proto__[polluted]=yes&constructor[prototype][admin]=true&prototype=bypass&safe=1&__proto__=evil';
  const result = parseQueryString(query);

  assert.equal(result.safe, 1);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.prototype.admin, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(result, '__proto__'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'constructor'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'prototype'), false);
});
