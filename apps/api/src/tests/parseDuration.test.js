import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration } from '../utils/parseDuration.js';

test('parseDuration correctly parses seconds, minutes, hours, days', () => {
  assert.equal(parseDuration('10s'), 10000);
  assert.equal(parseDuration('15m'), 900000);
  assert.equal(parseDuration('2h'), 7200000);
  assert.equal(parseDuration('1d'), 86400000);
  assert.equal(parseDuration('1w'), 604800000);
});

test('parseDuration parses milliseconds and default units', () => {
  assert.equal(parseDuration('500ms'), 500);
  assert.equal(parseDuration('250'), 250);
  assert.equal(parseDuration(1500), 1500);
});

test('parseDuration supports decimal values with rounding', () => {
  assert.equal(parseDuration('1.5s'), 1500);
  assert.equal(parseDuration('0.5h'), 1800000);
});

test('parseDuration rejects invalid formats and negatives defensively', () => {
  assert.equal(parseDuration('-10s'), null);
  assert.equal(parseDuration('invalid'), null);
  assert.equal(parseDuration('10xyz'), null);
  assert.equal(parseDuration(null), null);
  assert.equal(parseDuration(undefined), null);
  assert.equal(parseDuration({}), null);
  assert.equal(parseDuration(''), null);
});
