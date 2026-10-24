import test from 'node:test';
import assert from 'node:assert/strict';
import { safeJsonStringify } from '../utils/safeJsonStringify.js';

test('safeJsonStringify serializes standard objects, arrays, and primitives correctly', () => {
  assert.equal(safeJsonStringify({ name: 'Alice', age: 30 }), '{"name":"Alice","age":30}');
  assert.equal(safeJsonStringify([1, 2, 'three']), '[1,2,"three"]');
  assert.equal(safeJsonStringify('hello'), '"hello"');
  assert.equal(safeJsonStringify(123), '123');
  assert.equal(safeJsonStringify(null), 'null');
  assert.equal(safeJsonStringify(true), 'true');
});

test('safeJsonStringify handles circular references in objects without throwing', () => {
  const circularObj = { title: 'Loop' };
  circularObj.self = circularObj;

  const result = safeJsonStringify(circularObj);
  assert.ok(result.includes('"title":"Loop"'));
  assert.ok(result.includes('"self":"[Circular]"'));
  assert.doesNotThrow(() => JSON.parse(result));
});

test('safeJsonStringify handles circular references in nested arrays and complex graphs', () => {
  const nodeA = { name: 'A' };
  const nodeB = { name: 'B' };
  nodeA.neighbor = nodeB;
  nodeB.neighbor = nodeA;

  const resNodes = safeJsonStringify(nodeA);
  assert.ok(resNodes.includes('"name":"A"'));
  assert.ok(resNodes.includes('"name":"B"'));
  assert.ok(resNodes.includes('"neighbor":"[Circular]"'));

  const circularArr = [10, 20];
  circularArr.push(circularArr);
  const resArr = safeJsonStringify(circularArr);
  assert.equal(resArr, '[10,20,"[Circular]"]');
});

test('safeJsonStringify converts BigInt values to strings without throwing TypeError', () => {
  const bigPayload = {
    id: 9007199254740991000n,
    smallBig: 42n,
    list: [1n, 2n, 3n]
  };

  const jsonStr = safeJsonStringify(bigPayload);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.id, '9007199254740991000');
  assert.equal(parsed.smallBig, '42');
  assert.deepEqual(parsed.list, ['1', '2', '3']);

  assert.equal(safeJsonStringify(100n), '"100"');
});

test('safeJsonStringify returns fallback on serialization errors', () => {
  const throwingObj = {
    get boom() {
      throw new Error('Fatal property error');
    }
  };

  assert.equal(safeJsonStringify(throwingObj), '{}');
  assert.equal(safeJsonStringify(throwingObj, '{"error":true}'), '{"error":true}');
  assert.equal(safeJsonStringify(throwingObj, 'null'), 'null');
});

test('safeJsonStringify returns fallback for undefined and unsupported input values', () => {
  assert.equal(safeJsonStringify(undefined), '{}');
  assert.equal(safeJsonStringify(undefined, 'null'), 'null');
  assert.equal(safeJsonStringify(() => {}), '{}');
  assert.equal(safeJsonStringify(Symbol('test'), 'fallback'), 'fallback');
});
