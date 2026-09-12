import { describe, it } from 'node:test';
import assert from 'node:assert';
import { deepMerge, isPlainObject } from '../utils/deepMerge.js';

describe('deepMerge Utility', () => {
  it('should deeply merge nested plain objects recursively', () => {
    const target = { a: 1, b: { c: 2, d: 3 } };
    const source = { b: { d: 4, e: 5 }, f: 6 };
    const result = deepMerge(target, source);

    assert.deepStrictEqual(result, {
      a: 1,
      b: { c: 2, d: 4, e: 5 },
      f: 6,
    });
    assert.strictEqual(result, target);
  });

  it('should merge multiple source objects in left-to-right order', () => {
    const target = { x: 1 };
    const s1 = { y: 2, z: { a: 10 } };
    const s2 = { z: { b: 20 }, w: 4 };
    const result = deepMerge(target, s1, s2);

    assert.deepStrictEqual(result, {
      x: 1,
      y: 2,
      z: { a: 10, b: 20 },
      w: 4,
    });
  });

  it('should clone array values and deep merge nested objects inside arrays', () => {
    const target = { items: [{ id: 1 }] };
    const source = { items: [{ id: 2, name: 'item2' }, 'raw'] };
    const result = deepMerge(target, source);

    assert.deepStrictEqual(result.items, [{ id: 2, name: 'item2' }, 'raw']);
    assert.notStrictEqual(result.items[0], source.items[0]);
  });

  it('should prevent prototype pollution attacks completely', () => {
    const malicious = JSON.parse('{"__proto__": {"isAdmin": true}, "constructor": "bad"}');
    const target = {};
    deepMerge(target, malicious);

    assert.strictEqual(Object.prototype.isAdmin, undefined);
    assert.strictEqual(target.__proto__, Object.prototype);
  });

  it('should accurately identify plain objects using isPlainObject', () => {
    assert.strictEqual(isPlainObject({}), true);
    assert.strictEqual(isPlainObject(Object.create(null)), true);
    assert.strictEqual(isPlainObject([]), false);
    assert.strictEqual(isPlainObject(null), false);
    assert.strictEqual(isPlainObject(new Date()), false);
    assert.strictEqual(isPlainObject(new Map()), false);
  });

  it('should throw TypeError when target is not a plain object', () => {
    assert.throws(() => deepMerge(null, {}), { name: 'TypeError' });
    assert.throws(() => deepMerge([], {}), { name: 'TypeError' });
    assert.throws(() => deepMerge('string', {}), { name: 'TypeError' });
  });
});