import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pickBy, omitBy, pick, omit } from '../utils/objectFilters.js';

describe('objectFilters Utility', () => {
  it('should filter object properties using custom predicate in pickBy', () => {
    const user = { name: 'Alice', age: 28, active: true, score: 0 };
    const result = pickBy(user, (val) => typeof val === 'number');
    assert.deepStrictEqual(result, { age: 28, score: 0 });
  });

  it('should default to truthy predicate in pickBy', () => {
    const user = { name: 'Bob', email: '', age: 30, empty: null, unset: undefined };
    const result = pickBy(user);
    assert.deepStrictEqual(result, { name: 'Bob', age: 30 });
  });

  it('should filter object properties excluding matches in omitBy', () => {
    const data = { id: 101, token: 'secret', passwordHash: 'hash123', username: 'admin' };
    const result = omitBy(data, (_, key) => key.toLowerCase().includes('token') || key.toLowerCase().includes('password'));
    assert.deepStrictEqual(result, { id: 101, username: 'admin' });
  });

  it('should support pick and omit with array of keys', () => {
    const config = { host: 'localhost', port: 8080, user: 'root', pass: '1234' };
    const picked = pick(config, ['host', 'port']);
    assert.deepStrictEqual(picked, { host: 'localhost', port: 8080 });

    const omitted = omit(config, ['pass']);
    assert.deepStrictEqual(omitted, { host: 'localhost', port: 8080, user: 'root' });
  });

  it('should prevent prototype pollution properties', () => {
    const polluted = JSON.parse('{"__proto__": {"admin": true}, "constructor": "bad", "name": "safe"}');
    const result = pickBy(polluted, () => true);
    assert.deepStrictEqual(result, { name: 'safe' });
    assert.strictEqual(Object.prototype.admin, undefined);
  });

  it('should throw TypeError on non-object inputs', () => {
    assert.throws(() => pickBy(null), { name: 'TypeError' });
    assert.throws(() => pickBy([1, 2, 3]), { name: 'TypeError' });
    assert.throws(() => pickBy('string'), { name: 'TypeError' });
    assert.throws(() => pickBy({}, 'not-a-fn'), { name: 'TypeError' });
    assert.throws(() => omitBy(null), { name: 'TypeError' });
  });
});