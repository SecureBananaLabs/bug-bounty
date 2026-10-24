import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { groupBy } from '../utils/groupBy.js';

describe('Defensive Collection Grouping Utility (groupBy)', () => {
  it('groups items by string property name', () => {
    const list = [
      { id: 1, category: 'finance' },
      { id: 2, category: 'tech' },
      { id: 3, category: 'finance' },
    ];

    const grouped = groupBy(list, 'category');
    assert.deepEqual(grouped.finance, [
      { id: 1, category: 'finance' },
      { id: 3, category: 'finance' },
    ]);
    assert.deepEqual(grouped.tech, [{ id: 2, category: 'tech' }]);
  });

  it('groups items using a custom callback function', () => {
    const numbers = [6.1, 4.2, 6.3, 4.8];
    const grouped = groupBy(numbers, Math.floor);

    assert.deepEqual(grouped['4'], [4.2, 4.8]);
    assert.deepEqual(grouped['6'], [6.1, 6.3]);
  });

  it('uses identity function when iteratee is omitted', () => {
    const items = ['a', 'b', 'a', 'c'];
    const grouped = groupBy(items);

    assert.deepEqual(grouped.a, ['a', 'a']);
    assert.deepEqual(grouped.b, ['b']);
    assert.deepEqual(grouped.c, ['c']);
  });

  it('supports grouping by Symbol property key', () => {
    const groupKey = Symbol('department');
    const employees = [
      { name: 'Alice', [groupKey]: 'dev' },
      { name: 'Bob', [groupKey]: 'qa' },
      { name: 'Charlie', [groupKey]: 'dev' },
    ];

    const grouped = groupBy(employees, groupKey);
    assert.deepEqual(grouped.dev, [
      { name: 'Alice', [groupKey]: 'dev' },
      { name: 'Charlie', [groupKey]: 'dev' },
    ]);
    assert.deepEqual(grouped.qa, [{ name: 'Bob', [groupKey]: 'qa' }]);
  });

  it('supports Symbol values returned directly from iteratee function', () => {
    const symA = Symbol('A');
    const symB = Symbol('B');
    const items = [
      { type: 1, val: 'first' },
      { type: 2, val: 'second' },
      { type: 1, val: 'third' },
    ];

    const grouped = groupBy(items, (item) => (item.type === 1 ? symA : symB));
    assert.deepEqual(grouped[symA], [
      { type: 1, val: 'first' },
      { type: 1, val: 'third' },
    ]);
    assert.deepEqual(grouped[symB], [{ type: 2, val: 'second' }]);
  });

  it('coerces various key types into strings (numbers, booleans, null, undefined)', () => {
    const items = [
      { val: true, id: 1 },
      { val: null, id: 2 },
      { val: undefined, id: 3 },
      { val: 0, id: 4 },
      { val: false, id: 5 },
    ];

    const grouped = groupBy(items, 'val');
    assert.deepEqual(grouped['true'], [{ val: true, id: 1 }]);
    assert.deepEqual(grouped['null'], [{ val: null, id: 2 }]);
    assert.deepEqual(grouped['undefined'], [{ val: undefined, id: 3 }]);
    assert.deepEqual(grouped['0'], [{ val: 0, id: 4 }]);
    assert.deepEqual(grouped['false'], [{ val: false, id: 5 }]);
  });

  describe('Prototype pollution defense (CWE-1321)', () => {
    it('prevents prototype pollution on __proto__, constructor, and prototype', () => {
      const malicious = [
        { type: '__proto__', val: 1 },
        { type: 'constructor', val: 2 },
        { type: 'prototype', val: 3 },
        { type: 'toString', val: 4 },
        { type: 'valid', val: 5 },
      ];

      const grouped = groupBy(malicious, 'type');

      // Ensure dangerous properties are not own properties and not modified on Object.prototype
      assert.equal(Object.prototype.hasOwnProperty.call(grouped, '__proto__'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(grouped, 'constructor'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(grouped, 'prototype'), false);

      // Verify Object.prototype method name works as a valid grouping key
      assert.deepEqual(grouped.toString, [{ type: 'toString', val: 4 }]);
      assert.deepEqual(grouped.valid, [{ type: 'valid', val: 5 }]);

      // Verify global Object prototype was not corrupted
      assert.equal(typeof Object.prototype.toString, 'function');
    });

    it('throws error when dangerAction is configured to throw', () => {
      const items = [{ key: '__proto__', val: 'attack' }];

      assert.throws(
        () => groupBy(items, 'key', { dangerAction: 'throw' }),
        /\[groupBy\] Disallowed dangerous prototype key: __proto__/
      );
    });

    it('creates pure null-prototype object when nullPrototype option is true', () => {
      const items = [{ cat: 'a' }, { cat: 'b' }];
      const grouped = groupBy(items, 'cat', { nullPrototype: true });

      assert.equal(Object.getPrototypeOf(grouped), null);
      assert.deepEqual(grouped.a, [{ cat: 'a' }]);
      assert.deepEqual(grouped.b, [{ cat: 'b' }]);
    });
  });

  describe('Empty and invalid input handling', () => {
    it('returns empty object for empty array', () => {
      assert.deepEqual(groupBy([]), {});
    });

    it('returns empty object for null and undefined inputs', () => {
      assert.deepEqual(groupBy(null), {});
      assert.deepEqual(groupBy(undefined), {});
    });

    it('returns empty object for non-array inputs', () => {
      assert.deepEqual(groupBy(42), {});
      assert.deepEqual(groupBy('string'), {});
      assert.deepEqual(groupBy({ length: 0 }), {});
    });

    it('returns null-prototype object when non-array with nullPrototype is provided', () => {
      const res = groupBy(null, 'cat', { nullPrototype: true });
      assert.equal(Object.getPrototypeOf(res), null);
      assert.deepEqual(Object.keys(res), []);
    });
  });

  describe('Iteratee arguments and options', () => {
    it('passes item, index, and array to iteratee function', () => {
      const recorded = [];
      const array = ['x', 'y'];

      groupBy(array, (item, index, arr) => {
        recorded.push({ item, index, sameArr: arr === array });
        return item;
      });

      assert.deepEqual(recorded, [
        { item: 'x', index: 0, sameArr: true },
        { item: 'y', index: 1, sameArr: true },
      ]);
    });

    it('preserves thisArg context binding for iteratee', () => {
      const ctx = {
        prefix: 'grp_',
        makeKey(item) {
          return this.prefix + item;
        },
      };

      const grouped = groupBy(
        ['apple', 'banana'],
        function (item) {
          return this.makeKey(item);
        },
        { thisArg: ctx }
      );

      assert.deepEqual(grouped.grp_apple, ['apple']);
      assert.deepEqual(grouped.grp_banana, ['banana']);
    });

    it('skips holes in sparse arrays when skipHoles is true', () => {
      const sparse = ['a', , 'b', , 'a'];
      const grouped = groupBy(sparse, undefined, { skipHoles: true });

      assert.deepEqual(grouped.a, ['a', 'a']);
      assert.deepEqual(grouped.b, ['b']);
      assert.equal(grouped.undefined, undefined);
    });

    it('supports suppressErrors to group failed iterations under __errors__', () => {
      const items = ['valid1', 123, 'valid2'];

      const grouped = groupBy(
        items,
        (item) => {
          if (typeof item !== 'string') {
            throw new TypeError('Must be string');
          }
          return item[0];
        },
        { suppressErrors: true }
      );

      assert.deepEqual(grouped.v, ['valid1', 'valid2']);
      assert.deepEqual(grouped.__errors__, [123]);
    });

    it('supports custom onError handler to recover alternative key', () => {
      const items = ['alpha', null, 'avocado'];

      const grouped = groupBy(
        items,
        (item) => item.toUpperCase(),
        {
          onError: (_err, item) => 'MISSING',
        }
      );

      assert.deepEqual(grouped.ALPHA, ['alpha']);
      assert.deepEqual(grouped.AVOCADO, ['avocado']);
      assert.deepEqual(grouped.MISSING, [null]);
    });

    it('wraps unhandled iteratee exceptions with context', () => {
      const items = ['ok', 'boom'];

      assert.throws(
        () => {
          groupBy(items, (item) => {
            if (item === 'boom') throw new Error('Crash');
            return item;
          });
        },
        (err) => {
          assert.match(err.message, /\[groupBy\] Iteratee threw an exception at index 1: Crash/);
          assert.equal(err.cause.message, 'Crash');
          return true;
        }
      );
    });

    it('handles thrown falsy and primitive values safely without secondary crashes', () => {
      // Thrown null
      assert.throws(
        () => groupBy([1], () => { throw null; }),
        (err) => {
          assert.equal(err.name, 'Error');
          assert.match(err.message, /\[groupBy\] Iteratee threw an exception at index 0: null/);
          assert.equal(err.cause, null);
          return true;
        }
      );

      // Thrown undefined
      assert.throws(
        () => groupBy([1], () => { throw undefined; }),
        (err) => {
          assert.equal(err.name, 'Error');
          assert.match(err.message, /\[groupBy\] Iteratee threw an exception at index 0: undefined/);
          assert.equal(err.cause, undefined);
          return true;
        }
      );

      // Thrown primitive string
      assert.throws(
        () => groupBy([1], () => { throw 'network-timeout'; }),
        (err) => {
          assert.equal(err.name, 'Error');
          assert.match(err.message, /\[groupBy\] Iteratee threw an exception at index 0: network-timeout/);
          assert.equal(err.cause, 'network-timeout');
          return true;
        }
      );
    });

    it('handles throwing array element getters safely', () => {
      const arr = [10];
      Object.defineProperty(arr, 1, {
        configurable: true,
        enumerable: true,
        get() {
          throw new Error('Getter access failure');
        },
      });
      arr.length = 2;

      // With default wrapping
      assert.throws(
        () => groupBy(arr, (n) => n > 5),
        (err) => {
          assert.equal(err.name, 'Error');
          assert.match(err.message, /\[groupBy\] Iteratee threw an exception at index 1: Getter access failure/);
          return true;
        }
      );

      // With suppressErrors: true
      const grouped = groupBy(arr, (n) => n > 5, { suppressErrors: true });
      assert.equal(grouped.__errors__.length, 1);
    });

    it('handles keys with null prototype safely without throwing TypeError', () => {
      const nullProtoKey = Object.create(null);
      const items = [{ id: 1 }];
      const grouped = groupBy(items, () => nullProtoKey);
      assert.deepEqual(grouped['[object Object]'], [{ id: 1 }]);
    });

    it('validates options type strictly', () => {
      assert.throws(() => groupBy([1, 2], undefined, null), {
        name: 'TypeError',
        message: '[groupBy] Expected options to be an object, received null',
      });

      assert.throws(() => groupBy([1, 2], undefined, 'invalid'), {
        name: 'TypeError',
        message: '[groupBy] Expected options to be an object, received string',
      });
    });
  });

  it('does not mutate the source array (immutability)', () => {
    const list = [{ id: 1 }, { id: 2 }];
    const copy = [{ id: 1 }, { id: 2 }];

    groupBy(list, 'id');
    assert.deepEqual(list, copy);
  });

  it('efficiently groups large arrays (10,000 items)', () => {
    const large = Array.from({ length: 10_000 }, (_, i) => ({
      tier: `tier_${i % 10}`,
      val: i,
    }));

    const grouped = groupBy(large, 'tier');
    assert.equal(Object.keys(grouped).length, 10);
    assert.equal(grouped.tier_0.length, 1000);
    assert.equal(grouped.tier_9.length, 1000);
  });
});
