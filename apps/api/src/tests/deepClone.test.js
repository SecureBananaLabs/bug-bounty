import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import deepClone, {
  isCloneable,
  safeClone,
} from '../utils/deepClone.js';

describe('deepClone - Defensive Deep Clone Utility', () => {
  describe('primitives and immutables', () => {
    it('returns primitives directly', () => {
      assert.strictEqual(deepClone(42), 42);
      assert.strictEqual(deepClone('hello'), 'hello');
      assert.strictEqual(deepClone(true), true);
      assert.strictEqual(deepClone(null), null);
      assert.strictEqual(deepClone(undefined), undefined);
      assert.strictEqual(deepClone(100n), 100n);
      const sym = Symbol('token');
      assert.strictEqual(deepClone(sym), sym);
    });

    it('returns function references directly without crashing', () => {
      const fn = () => 123;
      assert.strictEqual(deepClone(fn), fn);
    });
  });

  describe('plain objects and nested objects', () => {
    it('clones nested objects with full memory isolation', () => {
      const original = {
        name: 'Alice',
        meta: {
          role: 'admin',
          scores: [10, 20, 30],
        },
      };
      const copy = deepClone(original);

      assert.deepStrictEqual(copy, original);
      assert.notStrictEqual(copy, original);
      assert.notStrictEqual(copy.meta, original.meta);
      assert.notStrictEqual(copy.meta.scores, original.meta.scores);

      // Mutate copy, ensure original is unchanged
      copy.meta.role = 'user';
      copy.meta.scores.push(40);
      assert.strictEqual(original.meta.role, 'admin');
      assert.strictEqual(original.meta.scores.length, 3);
    });

    it('preserves null prototype objects', () => {
      const nullProto = Object.create(null);
      nullProto.key = 'value';
      const copy = deepClone(nullProto);

      assert.strictEqual(Object.getPrototypeOf(copy), null);
      assert.strictEqual(copy.key, 'value');
      assert.notStrictEqual(copy, nullProto);
    });

    it('preserves custom prototype chain when enabled', () => {
      class CustomType {
        constructor(val) {
          this.val = val;
        }
        compute() {
          return this.val * 2;
        }
      }
      const instance = new CustomType(21);
      const copy = deepClone(instance);

      assert.strictEqual(copy.compute(), 42);
      assert.strictEqual(copy instanceof CustomType, true);
      assert.notStrictEqual(copy, instance);
    });
  });

  describe('circular references', () => {
    it('handles circular references in objects without infinite recursion', () => {
      const obj = { name: 'cyclic' };
      obj.self = obj;

      const copy = deepClone(obj);
      assert.strictEqual(copy.name, 'cyclic');
      assert.strictEqual(copy.self, copy);
      assert.notStrictEqual(copy, obj);
    });

    it('handles mutually recursive cyclic structures', () => {
      const first = { label: 'A' };
      const second = { label: 'B' };
      first.peer = second;
      second.peer = first;

      const copyFirst = deepClone(first);
      assert.strictEqual(copyFirst.label, 'A');
      assert.strictEqual(copyFirst.peer.label, 'B');
      assert.strictEqual(copyFirst.peer.peer, copyFirst);
      assert.notStrictEqual(copyFirst, first);
    });

    it('handles circular references in arrays', () => {
      const arr = [1, 2];
      arr.push(arr);

      const copyArr = deepClone(arr);
      assert.strictEqual(copyArr[0], 1);
      assert.strictEqual(copyArr[1], 2);
      assert.strictEqual(copyArr[2], copyArr);
      assert.notStrictEqual(copyArr, arr);
    });
  });

  describe('Maps and Sets', () => {
    it('deep clones Map entries and supports nested/cyclic maps', () => {
      const map = new Map();
      const keyObj = { id: 1 };
      const valObj = { name: 'Item' };
      map.set(keyObj, valObj);
      map.set('self', map);

      const copy = deepClone(map);
      assert.strictEqual(copy instanceof Map, true);
      assert.strictEqual(copy.size, 2);
      assert.strictEqual(copy.get('self'), copy);
      assert.notStrictEqual(copy, map);

      // Verify key and value objects were cloned
      for (const [k, v] of copy.entries()) {
        if (k !== 'self') {
          assert.deepStrictEqual(k, keyObj);
          assert.notStrictEqual(k, keyObj);
          assert.deepStrictEqual(v, valObj);
          assert.notStrictEqual(v, valObj);
        }
      }
    });

    it('deep clones Set elements and supports nested/cyclic sets', () => {
      const set = new Set();
      const item = { data: 'abc' };
      set.add(item);
      set.add(set);

      const copy = deepClone(set);
      assert.strictEqual(copy instanceof Set, true);
      assert.strictEqual(copy.size, 2);
      assert.strictEqual(copy.has(copy), true);
      assert.notStrictEqual(copy, set);

      for (const elem of copy) {
        if (elem !== copy) {
          assert.deepStrictEqual(elem, item);
          assert.notStrictEqual(elem, item);
        }
      }
    });
  });

  describe('Dates and RegExps', () => {
    it('clones Date objects with accurate timestamp and isolated instance', () => {
      const date = new Date('2026-10-25T00:00:00.000Z');
      const copy = deepClone(date);

      assert.strictEqual(copy instanceof Date, true);
      assert.strictEqual(copy.getTime(), date.getTime());
      assert.notStrictEqual(copy, date);

      copy.setFullYear(2030);
      assert.strictEqual(date.getFullYear(), 2026);
    });

    it('clones RegExp objects with flags and lastIndex state', () => {
      const regex = /pattern[a-z]+/gi;
      regex.lastIndex = 3;
      const copy = deepClone(regex);

      assert.strictEqual(copy instanceof RegExp, true);
      assert.strictEqual(copy.source, regex.source);
      assert.strictEqual(copy.flags, regex.flags);
      assert.strictEqual(copy.lastIndex, 3);
      assert.notStrictEqual(copy, regex);
    });
  });

  describe('ArrayBuffer and TypedArray views', () => {
    it('isolates ArrayBuffer memory allocations', () => {
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view[0] = 42;

      const copyBuffer = deepClone(buffer);
      const copyView = new Uint8Array(copyBuffer);

      assert.strictEqual(copyView[0], 42);
      copyView[0] = 99;
      assert.strictEqual(view[0], 42);
    });

    it('isolates TypedArrays (Uint8Array, Float64Array, BigInt64Array)', () => {
      const u8 = new Uint8Array([1, 2, 3, 4]);
      const copyU8 = deepClone(u8);
      assert.deepStrictEqual(Array.from(copyU8), [1, 2, 3, 4]);
      assert.notStrictEqual(copyU8, u8);
      copyU8[0] = 255;
      assert.strictEqual(u8[0], 1);

      const f64 = new Float64Array([1.23, 4.56]);
      const copyF64 = deepClone(f64);
      assert.deepStrictEqual(Array.from(copyF64), [1.23, 4.56]);
      assert.notStrictEqual(copyF64.buffer, f64.buffer);

      const b64 = new BigInt64Array([100n, 200n]);
      const copyB64 = deepClone(b64);
      assert.deepStrictEqual(Array.from(copyB64), [100n, 200n]);
      assert.notStrictEqual(copyB64, b64);
    });

    it('isolates DataView instances', () => {
      const buffer = new ArrayBuffer(16);
      const dv = new DataView(buffer, 4, 8);
      dv.setInt32(0, 123456);

      const copyDv = deepClone(dv);
      assert.strictEqual(copyDv instanceof DataView, true);
      assert.strictEqual(copyDv.getInt32(0), 123456);
      assert.strictEqual(copyDv.byteLength, 8);
      assert.notStrictEqual(copyDv.buffer, dv.buffer);
    });
  });

  describe('Error objects', () => {
    it('clones standard Error instances preserving message, name, and cause', () => {
      const rootCause = new Error('Database timeout');
      const err = new TypeError('Invalid payload');
      err.cause = rootCause;

      const copyErr = deepClone(err);
      assert.strictEqual(copyErr instanceof TypeError, true);
      assert.strictEqual(copyErr.message, 'Invalid payload');
      assert.strictEqual(copyErr.name, 'TypeError');
      assert.strictEqual(copyErr.cause instanceof Error, true);
      assert.strictEqual(copyErr.cause.message, 'Database timeout');
      assert.notStrictEqual(copyErr, err);
      assert.notStrictEqual(copyErr.cause, rootCause);
    });
  });

  describe('Symbols and Prototype Pollution defense (CWE-1321)', () => {
    it('copies own Symbol keys accurately', () => {
      const symKey = Symbol('bountyKey');
      const obj = {
        [symKey]: { secret: 1337 },
        public: 'yes',
      };

      const copy = deepClone(obj);
      assert.strictEqual(copy.public, 'yes');
      assert.deepStrictEqual(copy[symKey], { secret: 1337 });
      assert.notStrictEqual(copy[symKey], obj[symKey]);
    });

    it('neutralizes prototype pollution vectors (__proto__, constructor, prototype)', () => {
      const payload = JSON.parse('{"__proto__": {"polluted": true}, "safe": 1}');
      const copy = deepClone(payload);

      assert.strictEqual(copy.safe, 1);
      assert.strictEqual({}.polluted, undefined);
      assert.strictEqual(Object.prototype.polluted, undefined);
    });

    it('skips dangerous constructor/prototype overwrites', () => {
      const malicious = {
        constructor: { name: 'Exploit' },
        prototype: { exploit: true },
        regular: 42,
      };

      const copy = deepClone(malicious);
      assert.strictEqual(copy.regular, 42);
      assert.strictEqual(copy.exploit, undefined);
    });

    it('allows toggling preserveSymbols and preventPrototypePollution', () => {
      const sym = Symbol('ignored');
      const obj = { [sym]: 'value', normal: 'keep' };
      const copy = deepClone(obj, { preserveSymbols: false });
      assert.strictEqual(copy.normal, 'keep');
      assert.strictEqual(copy[sym], undefined);
    });
  });

  describe('maxDepth guard and helper utilities', () => {
    it('throws RangeError when exceeding maxDepth', () => {
      const deep = { next: { next: { next: { next: 1 } } } };
      assert.throws(() => deepClone(deep, { maxDepth: 2 }), RangeError);
    });

    it('isCloneable correctly identifies objects and functions', () => {
      assert.strictEqual(isCloneable({}), true);
      assert.strictEqual(isCloneable([]), true);
      assert.strictEqual(isCloneable(() => {}), true);
      assert.strictEqual(isCloneable(null), false);
      assert.strictEqual(isCloneable(123), false);
      assert.strictEqual(isCloneable('abc'), false);
    });

    it('safeClone returns fallback on error and clone on success', () => {
      const deep = { next: { next: { next: 1 } } };
      const failed = safeClone(deep, 'fallback-result', { maxDepth: 1 });
      assert.strictEqual(failed, 'fallback-result');

      const success = safeClone({ a: 1 }, null);
      assert.deepStrictEqual(success, { a: 1 });
    });
  });
});
