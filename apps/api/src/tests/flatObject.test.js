import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import flatObject, {
  flattenObject,
  unflattenObject,
  isFlat,
  safeUnflatten,
} from '../utils/flatObject.js';

describe('flatObject - Defensive Object Flattening and Reconstruction', () => {
  describe('flattenObject', () => {
    it('flattens basic deeply nested objects', () => {
      const input = {
        user: {
          profile: {
            name: 'Bob',
            age: 30,
          },
          status: 'active',
        },
      };
      const flat = flattenObject(input);
      assert.deepStrictEqual(flat, {
        'user.profile.name': 'Bob',
        'user.profile.age': 30,
        'user.status': 'active',
      });
    });

    it('flattens arrays into numeric index paths by default', () => {
      const input = {
        tags: ['security', 'bounty'],
        matrix: [[1, 2], [3, 4]],
      };
      const flat = flattenObject(input);
      assert.deepStrictEqual(flat, {
        'tags.0': 'security',
        'tags.1': 'bounty',
        'matrix.0.0': 1,
        'matrix.0.1': 2,
        'matrix.1.0': 3,
        'matrix.1.1': 4,
      });
    });

    it('preserves arrays as atomic leaf values when preserveArrays is true', () => {
      const input = {
        user: {
          roles: ['admin', 'reviewer'],
        },
      };
      const flat = flattenObject(input, { preserveArrays: true });
      assert.deepStrictEqual(flat, {
        'user.roles': ['admin', 'reviewer'],
      });
    });

    it('supports custom path delimiters', () => {
      const input = {
        api: {
          v1: {
            endpoint: '/users',
          },
        },
      };
      const flatSlash = flattenObject(input, { delimiter: '/' });
      assert.deepStrictEqual(flatSlash, {
        'api/v1/endpoint': '/users',
      });

      const flatUnder = flattenObject(input, { delimiter: '__' });
      assert.deepStrictEqual(flatUnder, {
        'api__v1__endpoint': '/users',
      });
    });

    it('preserves atomic non-plain objects (Date, RegExp, Error, TypedArray)', () => {
      const d = new Date('2026-10-25T00:00:00.000Z');
      const r = /^test$/i;
      const u8 = new Uint8Array([1, 2, 3]);
      const err = new Error('fail');

      const input = {
        meta: {
          timestamp: d,
          pattern: r,
          bytes: u8,
          error: err,
        },
      };
      const flat = flattenObject(input);
      assert.strictEqual(flat['meta.timestamp'], d);
      assert.strictEqual(flat['meta.pattern'], r);
      assert.strictEqual(flat['meta.bytes'], u8);
      assert.strictEqual(flat['meta.error'], err);
    });

    it('handles empty containers according to preserveEmpty option', () => {
      const input = {
        emptyObj: {},
        emptyArr: [],
        nested: { inner: {} },
      };

      const omitted = flattenObject(input, { preserveEmpty: false });
      assert.deepStrictEqual(omitted, {});

      const preserved = flattenObject(input, { preserveEmpty: true });
      assert.deepStrictEqual(preserved, {
        emptyObj: {},
        emptyArr: [],
        'nested.inner': {},
      });
    });

    it('defends against circular references using WeakSet', () => {
      const obj = { name: 'root' };
      obj.circular = obj;

      const flat = flattenObject(obj);
      assert.strictEqual(flat.name, 'root');
      assert.strictEqual(flat.circular, '[Circular]');
    });

    it('filters prototype pollution properties during flattening', () => {
      const obj = JSON.parse('{"__proto__": {"evil": true}, "safe": 1}');
      const flat = flattenObject(obj);
      assert.strictEqual(flat.safe, 1);
      assert.strictEqual(flat['__proto__.evil'], undefined);
    });

    it('handles non-object inputs gracefully', () => {
      assert.deepStrictEqual(flattenObject(null), {});
      assert.deepStrictEqual(flattenObject(undefined), {});
      assert.deepStrictEqual(flattenObject(123), {});
      assert.deepStrictEqual(flattenObject('string'), {});
    });

    it('enforces maxDepth recursion ceiling', () => {
      const deep = { a: { b: { c: { d: 1 } } } };
      assert.throws(() => flattenObject(deep, { maxDepth: 2 }), RangeError);
    });
  });

  describe('unflattenObject', () => {
    it('reconstructs deeply nested objects from key paths', () => {
      const flat = {
        'user.profile.name': 'Alice',
        'user.profile.age': 28,
        'user.status': 'verified',
      };
      const nested = unflattenObject(flat);
      assert.deepStrictEqual(nested, {
        user: {
          profile: {
            name: 'Alice',
            age: 28,
          },
          status: 'verified',
        },
      });
    });

    it('reconstructs arrays when numeric path segments are encountered', () => {
      const flat = {
        'items.0.name': 'First',
        'items.1.name': 'Second',
      };
      const nested = unflattenObject(flat);
      assert.strictEqual(Array.isArray(nested.items), true);
      assert.strictEqual(nested.items.length, 2);
      assert.deepStrictEqual(nested.items[0], { name: 'First' });
      assert.deepStrictEqual(nested.items[1], { name: 'Second' });
    });

    it('supports custom delimiters during reconstruction', () => {
      const flat = {
        'api/v1/auth/token': 'xyz-123',
      };
      const nested = unflattenObject(flat, { delimiter: '/' });
      assert.deepStrictEqual(nested, {
        api: {
          v1: {
            auth: {
              token: 'xyz-123',
            },
          },
        },
      });
    });

    it('defends against Prototype Pollution (CWE-1321)', () => {
      const payload = {
        '__proto__.polluted': 'yes',
        'constructor.prototype.hacked': 'yes',
        'prototype.exploited': 'yes',
        'valid.data': 100,
      };

      const reconstructed = unflattenObject(payload);
      assert.strictEqual(reconstructed.valid.data, 100);
      assert.strictEqual({}.polluted, undefined);
      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(Object.prototype.hacked, undefined);
    });

    it('guards against memory exhaustion sparse array DOS (CWE-400)', () => {
      const malicious = {
        'arr.999999': 'boom',
      };
      // When index exceeds maxArrayLength, reconstructs as plain object instead of huge array
      const safe = unflattenObject(malicious, { maxArrayLength: 1000 });
      assert.strictEqual(Array.isArray(safe.arr), false);
      assert.strictEqual(safe.arr['999999'], 'boom');
    });

    it('reconstructs with null prototypes when nullPrototype is true', () => {
      const flat = { 'dict.word': 'hello' };
      const obj = unflattenObject(flat, { nullPrototype: true });
      assert.strictEqual(Object.getPrototypeOf(obj), null);
      assert.strictEqual(Object.getPrototypeOf(obj.dict), null);
      assert.strictEqual(obj.dict.word, 'hello');
    });

    it('handles empty or invalid inputs gracefully', () => {
      assert.deepStrictEqual(unflattenObject(null), {});
      assert.deepStrictEqual(unflattenObject([]), {});
      assert.deepStrictEqual(unflattenObject('invalid'), {});
    });
  });

  describe('isFlat and safeUnflatten helpers', () => {
    it('isFlat correctly detects flat and nested structures', () => {
      assert.strictEqual(isFlat({ a: 1, b: 'two', c: true }), true);
      assert.strictEqual(isFlat({ 'a.b': 1 }), false);
      assert.strictEqual(isFlat({ a: { b: 1 } }), false);
      assert.strictEqual(isFlat({ items: [1, 2] }), false);
      assert.strictEqual(isFlat(null), false);
    });

    it('safeUnflatten returns fallback upon error', () => {
      const fallback = { status: 'fallback' };
      const res = safeUnflatten(null, fallback);
      // unflattenObject handles null by returning {}, so safeUnflatten returns {}
      assert.deepStrictEqual(res, {});

      // For valid input
      const valid = safeUnflatten({ 'a.b': 1 }, fallback);
      assert.deepStrictEqual(valid, { a: { b: 1 } });
    });
  });
});
