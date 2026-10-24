import test from 'node:test';
import assert from 'node:assert/strict';
import { deepClone } from '../utils/deepClone.js';

test('deepClone clones primitive values as-is', () => {
  assert.equal(deepClone(42), 42);
  assert.equal(deepClone('hello'), 'hello');
  assert.equal(deepClone(true), true);
  assert.equal(deepClone(null), null);
  assert.equal(deepClone(undefined), undefined);
  const sym = Symbol('test');
  assert.equal(deepClone(sym), sym);
});

test('deepClone creates distinct copy of nested objects and arrays', () => {
  const original = {
    user: { id: 101, profile: { name: 'Alice', tags: ['admin', 'dev'] } },
    scores: [10, 20, 30]
  };

  const copy = deepClone(original);
  assert.deepEqual(copy, original);
  assert.notEqual(copy, original);
  assert.notEqual(copy.user, original.user);
  assert.notEqual(copy.user.profile, original.user.profile);
  assert.notEqual(copy.scores, original.scores);

  copy.user.profile.name = 'Bob';
  assert.equal(original.user.profile.name, 'Alice');
});

test('deepClone clones Date and RegExp instances correctly', () => {
  const d = new Date('2026-10-24T18:00:00Z');
  const dClone = deepClone(d);
  assert.equal(dClone.getTime(), d.getTime());
  assert.notEqual(dClone, d);

  const r = /abc[0-9]+/gi;
  const rClone = deepClone(r);
  assert.equal(rClone.source, r.source);
  assert.equal(rClone.flags, r.flags);
  assert.notEqual(rClone, r);
});

test('deepClone clones Map and Set instances', () => {
  const myMap = new Map([['a', { v: 1 }], ['b', { v: 2 }]]);
  const mapClone = deepClone(myMap);
  assert.equal(mapClone.size, 2);
  assert.deepEqual(mapClone.get('a'), { v: 1 });
  assert.notEqual(mapClone.get('a'), myMap.get('a'));

  const mySet = new Set([{ id: 1 }, { id: 2 }]);
  const setClone = deepClone(mySet);
  assert.equal(setClone.size, 2);
  const [first] = setClone;
  const [origFirst] = mySet;
  assert.deepEqual(first, origFirst);
  assert.notEqual(first, origFirst);
});

test('deepClone handles circular references safely without stack overflow', () => {
  const nodeA = { name: 'A' };
  const nodeB = { name: 'B' };
  nodeA.neighbor = nodeB;
  nodeB.neighbor = nodeA;

  const cloneA = deepClone(nodeA);
  assert.equal(cloneA.name, 'A');
  assert.equal(cloneA.neighbor.name, 'B');
  assert.equal(cloneA.neighbor.neighbor, cloneA);
  assert.notEqual(cloneA, nodeA);
});

test('deepClone safely defends against prototype pollution', () => {
  const maliciousInput = JSON.parse('{"__proto__": {"polluted": true}, "normal": 123}');
  const safeClone = deepClone(maliciousInput);

  assert.equal(safeClone.normal, 123);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});
