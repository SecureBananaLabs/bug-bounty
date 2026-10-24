import test from 'node:test';
import assert from 'node:assert/strict';
import { deepEqual } from '../utils/deepEqual.js';

test('deepEqual compares primitives and handles NaN correctly', () => {
  assert.equal(deepEqual(42, 42), true);
  assert.equal(deepEqual('hello', 'hello'), true);
  assert.equal(deepEqual(true, true), true);
  assert.equal(deepEqual(NaN, NaN), true);
  assert.equal(deepEqual(0, -0), false);
  assert.equal(deepEqual(42, '42'), false);
  assert.equal(deepEqual(null, undefined), false);
});

test('deepEqual recursively compares nested objects', () => {
  const objA = { user: { id: 1, profile: { name: 'Alice', active: true } }, tags: ['dev', 'sec'] };
  const objB = { user: { id: 1, profile: { name: 'Alice', active: true } }, tags: ['dev', 'sec'] };
  const objC = { user: { id: 1, profile: { name: 'Alice', active: false } }, tags: ['dev', 'sec'] };

  assert.equal(deepEqual(objA, objB), true);
  assert.equal(deepEqual(objA, objC), false);
});

test('deepEqual compares nested arrays and array lengths', () => {
  assert.equal(deepEqual([1, [2, [3, 4]]], [1, [2, [3, 4]]]), true);
  assert.equal(deepEqual([1, 2, 3], [1, 2]), false);
  assert.equal(deepEqual([1, 2], [1, 2, 3]), false);
});

test('deepEqual compares Date instances by timestamp', () => {
  const d1 = new Date('2026-10-24T12:00:00Z');
  const d2 = new Date('2026-10-24T12:00:00Z');
  const d3 = new Date('2026-10-24T12:00:01Z');

  assert.equal(deepEqual(d1, d2), true);
  assert.equal(deepEqual(d1, d3), false);
});

test('deepEqual compares RegExp instances by source and flags', () => {
  assert.equal(deepEqual(/abc/gi, /abc/gi), true);
  assert.equal(deepEqual(/abc/g, /abc/i), false);
  assert.equal(deepEqual(/abc/g, /abd/g), false);
});

test('deepEqual compares Map instances deeply', () => {
  const mapA = new Map([['key1', { val: 10 }], ['key2', [1, 2]]]);
  const mapB = new Map([['key1', { val: 10 }], ['key2', [1, 2]]]);
  const mapC = new Map([['key1', { val: 99 }]]);

  assert.equal(deepEqual(mapA, mapB), true);
  assert.equal(deepEqual(mapA, mapC), false);
});

test('deepEqual compares Set instances deeply', () => {
  const setA = new Set([{ id: 1 }, { id: 2 }]);
  const setB = new Set([{ id: 1 }, { id: 2 }]);
  const setC = new Set([{ id: 1 }, { id: 3 }]);

  assert.equal(deepEqual(setA, setB), true);
  assert.equal(deepEqual(setA, setC), false);
});

test('deepEqual safely handles circular references without call stack overflow', () => {
  const circularA = { name: 'node' };
  circularA.self = circularA;

  const circularB = { name: 'node' };
  circularB.self = circularB;

  const circularC = { name: 'other' };
  circularC.self = circularC;

  assert.equal(deepEqual(circularA, circularB), true);
  assert.equal(deepEqual(circularA, circularC), false);
});

test('deepEqual distinguishes objects with different prototypes', () => {
  class CustomModel {
    constructor() {
      this.val = 1;
    }
  }
  const instance = new CustomModel();
  const plain = { val: 1 };

  assert.equal(deepEqual(instance, plain), false);
});
