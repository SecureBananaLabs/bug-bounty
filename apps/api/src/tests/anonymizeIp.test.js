import test from 'node:test';
import assert from 'node:assert/strict';
import { anonymizeIp } from '../utils/anonymizeIp.js';

test('anonymizeIp zeroes the last octet of valid IPv4 addresses', () => {
  assert.equal(anonymizeIp('192.168.1.123'), '192.168.1.0');
  assert.equal(anonymizeIp('10.0.0.1'), '10.0.0.0');
  assert.equal(anonymizeIp('172.16.254.254'), '172.16.254.0');
});

test('anonymizeIp correctly handles IPv4-mapped IPv6 addresses', () => {
  assert.equal(anonymizeIp('::ffff:192.168.1.55'), '::ffff:192.168.1.0');
});

test('anonymizeIp truncates and zeroes interface identifier for IPv6', () => {
  assert.equal(anonymizeIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334'), '2001:0db8:85a3::');
  assert.equal(anonymizeIp('::1'), '::1');
});

test('anonymizeIp trims surrounding whitespace', () => {
  assert.equal(anonymizeIp('   8.8.8.8   '), '8.8.8.0');
});

test('anonymizeIp defensively rejects malformed and non-string inputs', () => {
  assert.equal(anonymizeIp('invalid-ip'), '');
  assert.equal(anonymizeIp('256.0.0.1'), '');
  assert.equal(anonymizeIp('1.2.3'), '');
  assert.equal(anonymizeIp(null), '');
  assert.equal(anonymizeIp(undefined), '');
  assert.equal(anonymizeIp(12345), '');
  assert.equal(anonymizeIp({}), '');
  assert.equal(anonymizeIp(''), '');
});
