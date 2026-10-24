import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { partition } from '../utils/partition.js';

describe('Defensive Partition Utility (partition)', () => {
  it('partitions numbers based on even/odd predicate', () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const [evens, odds] = partition(numbers, (n) => n % 2 === 0);

    assert.deepEqual(evens, [2, 4, 6]);
    assert.deepEqual(odds, [1, 3, 5]);
  });

  it('uses Boolean as default predicate when none is provided', () => {
    const mixed = [0, 1, false, true, '', 'hello', null, undefined, NaN, 42];
    const [truthy, falsy] = partition(mixed);

    assert.deepEqual(truthy, [1, true, 'hello', 42]);
    assert.deepEqual(falsy, [0, false, '', null, undefined, NaN]);
  });

  it('partitions objects using a string property name shorthand', () => {
    const users = [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
      { id: 3, name: 'Charlie', active: true },
      { id: 4, name: 'Dave' }, // undefined active
    ];

    const [activeUsers, inactiveUsers] = partition(users, 'active');
    assert.equal(activeUsers.length, 2);
    assert.equal(activeUsers[0].name, 'Alice');
    assert.equal(activeUsers[1].name, 'Charlie');
    assert.equal(inactiveUsers.length, 2);
    assert.equal(inactiveUsers[0].name, 'Bob');
    assert.equal(inactiveUsers[1].name, 'Dave');
  });

  it('partitions objects using a Symbol property key shorthand', () => {
    const isSpecial = Symbol('isSpecial');
    const records = [
      { id: 1, [isSpecial]: true },
      { id: 2, [isSpecial]: false },
      { id: 3 },
      { id: 4, [isSpecial]: 'yes' },
    ];

    const [special, regular] = partition(records, isSpecial);
    assert.equal(special.length, 2);
    assert.equal(special[0].id, 1);
    assert.equal(special[1].id, 4);
    assert.equal(regular.length, 2);
    assert.equal(regular[0].id, 2);
    assert.equal(regular[1].id, 3);
  });

  it('passes item, index, and array to the predicate function', () => {
    const recorded = [];
    const source = ['a', 'b', 'c'];

    partition(source, (item, index, arr) => {
      recorded.push({ item, index, sameArr: arr === source });
      return index % 2 === 0;
    });

    assert.deepEqual(recorded, [
      { item: 'a', index: 0, sameArr: true },
      { item: 'b', index: 1, sameArr: true },
      { item: 'c', index: 2, sameArr: true },
    ]);
  });

  it('preserves thisArg context binding for predicate', () => {
    const context = {
      threshold: 10,
      test(val) {
        return val >= this.threshold;
      },
    };

    const numbers = [5, 10, 15, 2];
    const [matching, nonMatching] = partition(
      numbers,
      function (n) {
        return this.test(n);
      },
      { thisArg: context }
    );

    assert.deepEqual(matching, [10, 15]);
    assert.deepEqual(nonMatching, [5, 2]);
  });

  it('throws TypeError for non-array inputs (strict type validation)', () => {
    assert.throws(() => partition(null), {
      name: 'TypeError',
      message: '[partition] Expected first argument to be an Array, received null',
    });

    assert.throws(() => partition(undefined), {
      name: 'TypeError',
      message: '[partition] Expected first argument to be an Array, received undefined',
    });

    assert.throws(() => partition(123), {
      name: 'TypeError',
      message: '[partition] Expected first argument to be an Array, received number',
    });

    assert.throws(() => partition('hello'), {
      name: 'TypeError',
      message: '[partition] Expected first argument to be an Array, received string',
    });

    assert.throws(() => partition({ length: 0 }), {
      name: 'TypeError',
      message: '[partition] Expected first argument to be an Array, received object',
    });

    assert.throws(() => partition(new Set([1, 2])), {
      name: 'TypeError',
      message: '[partition] Expected first argument to be an Array, received object',
    });
  });

  it('throws TypeError for invalid predicate arguments', () => {
    assert.throws(() => partition([1, 2], 123), {
      name: 'TypeError',
      message: '[partition] Expected predicate to be a function, string, symbol, or undefined, received number',
    });

    assert.throws(() => partition([1, 2], {}), {
      name: 'TypeError',
      message: '[partition] Expected predicate to be a function, string, symbol, or undefined, received object',
    });

    assert.throws(() => partition([1, 2], true), {
      name: 'TypeError',
      message: '[partition] Expected predicate to be a function, string, symbol, or undefined, received boolean',
    });
  });

  it('throws TypeError for invalid options argument', () => {
    assert.throws(() => partition([1, 2], Boolean, null), {
      name: 'TypeError',
      message: '[partition] Expected options to be an object, received null',
    });

    assert.throws(() => partition([1, 2], Boolean, 'options'), {
      name: 'TypeError',
      message: '[partition] Expected options to be an object, received string',
    });
  });

  describe('Sparse array defense', () => {
    it('handles sparse array holes safely without falling into prototype pollution', () => {
      const sparse = [1, , 3]; // index 1 is a hole

      // Temporarily pollute Array.prototype to simulate prototype pollution attack
      Array.prototype[1] = 'POLLUTED_VALUE';
      try {
        const [truthy, falsy] = partition(sparse, (item) => item !== undefined);
        assert.deepEqual(truthy, [1, 3]);
        assert.deepEqual(falsy, [undefined]);
      } finally {
        delete Array.prototype[1];
      }
    });

    it('supports skipHoles option to exclude array holes from output', () => {
      const sparse = [10, , 20, , 30];
      const [evens, odds] = partition(sparse, (n) => n % 2 === 0, { skipHoles: true });

      assert.deepEqual(evens, [10, 20, 30]);
      assert.deepEqual(odds, []);
    });
  });

  describe('Predicate exception safety', () => {
    it('wraps unhandled predicate exceptions with context and cause by default', () => {
      const items = ['ok1', 'error', 'ok2'];

      assert.throws(
        () => {
          partition(items, (item) => {
            if (item === 'error') {
              throw new RangeError('Failure occurred');
            }
            return true;
          });
        },
        (err) => {
          assert.equal(err.name, 'Error');
          assert.match(err.message, /\[partition\] Predicate evaluation threw an exception at index 1: Failure occurred/);
          assert.equal(err.cause.name, 'RangeError');
          return true;
        }
      );
    });

    it('safely routes throwing items to nonMatches when suppressErrors is true', () => {
      const items = [10, 'invalid', 20];
      const [matches, nonMatches] = partition(
        items,
        (item) => {
          if (typeof item !== 'number') {
            throw new TypeError('Not a number');
          }
          return item > 15;
        },
        { suppressErrors: true }
      );

      assert.deepEqual(matches, [20]);
      assert.deepEqual(nonMatches, [10, 'invalid']);
    });

    it('supports custom onError handler to recover or omit items', () => {
      const items = [1, 2, 'bad', 4];

      // Custom handler recovers by returning true for 'bad'
      const [matches, nonMatches] = partition(
        items,
        (n) => {
          if (typeof n !== 'number') throw new Error('invalid');
          return n % 2 === 0;
        },
        {
          onError: (_err, item) => (item === 'bad' ? true : false),
        }
      );

      assert.deepEqual(matches, [2, 'bad', 4]);
      assert.deepEqual(nonMatches, [1]);

      // Custom handler omits item completely
      const [omittedMatches, omittedNonMatches] = partition(
        items,
        (n) => {
          if (typeof n !== 'number') throw new Error('invalid');
          return n % 2 === 0;
        },
        {
          onError: (_err, _item) => 'omit',
        }
      );

      assert.deepEqual(omittedMatches, [2, 4]);
      assert.deepEqual(omittedNonMatches, [1]);
    });

    it('handles thrown falsy and primitive values safely without secondary crashes', () => {
      // Thrown null
      assert.throws(
        () => partition([1], () => { throw null; }),
        (err) => {
          assert.equal(err.name, 'Error');
          assert.match(err.message, /\[partition\] Predicate evaluation threw an exception at index 0: null/);
          assert.equal(err.cause, null);
          return true;
        }
      );

      // Thrown undefined
      assert.throws(
        () => partition([1], () => { throw undefined; }),
        (err) => {
          assert.equal(err.name, 'Error');
          assert.match(err.message, /\[partition\] Predicate evaluation threw an exception at index 0: undefined/);
          assert.equal(err.cause, undefined);
          return true;
        }
      );

      // Thrown primitive string
      assert.throws(
        () => partition([1], () => { throw 'network-timeout'; }),
        (err) => {
          assert.equal(err.name, 'Error');
          assert.match(err.message, /\[partition\] Predicate evaluation threw an exception at index 0: network-timeout/);
          assert.equal(err.cause, 'network-timeout');
          return true;
        }
      );
    });

    it('handles array elements with throwing property getters safely', () => {
      const arr = [10];
      Object.defineProperty(arr, 1, {
        configurable: true,
        enumerable: true,
        get() {
          throw new Error('Getter access failure');
        },
      });
      arr.length = 2;

      // With default exception wrapping
      assert.throws(
        () => partition(arr, (n) => n > 5),
        (err) => {
          assert.equal(err.name, 'Error');
          assert.match(err.message, /\[partition\] Predicate evaluation threw an exception at index 1: Getter access failure/);
          return true;
        }
      );

      // With suppressErrors: true
      const [matches, nonMatches] = partition(arr, (n) => n > 5, { suppressErrors: true });
      assert.deepEqual(matches, [10]);
      assert.equal(nonMatches.length, 1);
    });
  });

  it('leaves the original array unmodified (immutability)', () => {
    const original = [1, 2, 3];
    const clone = [...original];

    partition(original, (n) => n > 1);

    assert.deepEqual(original, clone);
  });

  it('returns [[], []] when given an empty array', () => {
    const [matches, nonMatches] = partition([]);
    assert.deepEqual(matches, []);
    assert.deepEqual(nonMatches, []);
  });

  it('efficiently partitions large arrays (10,000 items)', () => {
    const large = Array.from({ length: 10_000 }, (_, i) => i);
    const [evens, odds] = partition(large, (n) => n % 2 === 0);

    assert.equal(evens.length, 5000);
    assert.equal(odds.length, 5000);
    assert.equal(evens[0], 0);
    assert.equal(odds[0], 1);
  });
});
