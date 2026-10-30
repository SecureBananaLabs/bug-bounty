import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp } from '../utils/clamp.js';

test('clamp keeps numbers within [min, max] range unchanged', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(0, 0, 10), 0);
  assert.equal(clamp(10, 0, 10), 10);
  assert.equal(clamp(-2.5, -5, 0), -2.5);
});

test('clamp clamps numbers below min up to min', () => {
  assert.equal(clamp(-10, 0, 100), 0);
  assert.equal(clamp(-0.1, 0, 5), 0);
  assert.equal(clamp(-100, -50, -10), -50);
});

test('clamp clamps numbers above max down to max', () => {
  assert.equal(clamp(150, 0, 100), 100);
  assert.equal(clamp(10.1, 0, 10), 10);
  assert.equal(clamp(0, -50, -10), -10);
});

test('clamp normalizes inverted bounds automatically when min > max', () => {
  assert.equal(clamp(5, 10, 0), 5);
  assert.equal(clamp(-5, 10, 0), 0);
  assert.equal(clamp(15, 10, 0), 10);
});

test('clamp handles non-numeric and NaN values defensively', () => {
  assert.equal(clamp('abc', 0, 10), 0);
  assert.equal(clamp(null, 5, 20), 5);
  assert.equal(clamp(undefined, 10, 50), 10);
  assert.equal(clamp(NaN, -10, 10), -10);
});

test('clamp supports infinite boundaries', () => {
  assert.equal(clamp(1000, 0, Infinity), 1000);
  assert.equal(clamp(-50, 0, Infinity), 0);
  assert.equal(clamp(-1000, -Infinity, 0), -1000);
  assert.equal(clamp(50, -Infinity, 0), 0);
});
