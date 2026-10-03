import { describe, it } from 'node:test';
import assert from 'node:assert';
import { partition } from '../utils/partition.js';

describe('partition Utility', () => {
  it('should split arrays based on custom predicate', () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const [evens, odds] = partition(numbers, (n) => n % 2 === 0);
    assert.deepStrictEqual(evens, [2, 4, 6]);
    assert.deepStrictEqual(odds, [1, 3, 5]);
  });

  it('should default to boolean truthiness for arrays when predicate is omitted', () => {
    const items = [0, 1, false, 2, '', 3, null, undefined, 'hello'];
    const [truthy, falsy] = partition(items);
    assert.deepStrictEqual(truthy, [1, 2, 3, 'hello']);
    assert.deepStrictEqual(falsy, [0, false, '', null, undefined]);
  });

  it('should partition plain JavaScript objects by value/key', () => {
    const userScores = { alice: 85, bob: 40, charlie: 92, dave: 58 };
    const [passed, failed] = partition(userScores, (score) => score >= 60);
    assert.deepStrictEqual(passed, { alice: 85, charlie: 92 });
    assert.deepStrictEqual(failed, { bob: 40, dave: 58 });
  });

  it('should partition Set instances preserving Set types', () => {
    const set = new Set(['apple', 'banana', 'avocado', 'cherry']);
    const [aFruits, otherFruits] = partition(set, (fruit) => fruit.startsWith('a'));
    assert.ok(aFruits instanceof Set);
    assert.ok(otherFruits instanceof Set);
    assert.deepStrictEqual([...aFruits], ['apple', 'avocado']);
    assert.deepStrictEqual([...otherFruits], ['banana', 'cherry']);
  });

  it('should partition Map instances preserving Map types', () => {
    const map = new Map([
      ['k1', 10],
      ['k2', 25],
      ['k3', 30],
    ]);
    const [greaterThan20, others] = partition(map, (val) => val > 20);
    assert.ok(greaterThan20 instanceof Map);
    assert.ok(others instanceof Map);
    assert.deepStrictEqual([...greaterThan20.entries()], [['k2', 25], ['k3', 30]]);
    assert.deepStrictEqual([...others.entries()], [['k1', 10]]);
  });

  it('should throw TypeError on invalid inputs', () => {
    assert.throws(() => partition(null), { name: 'TypeError' });
    assert.throws(() => partition(undefined), { name: 'TypeError' });
    assert.throws(() => partition(123), { name: 'TypeError' });
    assert.throws(() => partition([1, 2], 'invalid-predicate'), { name: 'TypeError' });
  });
});