import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickBy, omitBy } from '../utils/filterObject.js';

describe('Prototype-Safe Object Filtering Helpers (pickBy & omitBy)', () => {
  const user = {
    id: 101,
    username: 'whyst0ne',
    passwordHash: 'secret_hash',
    apiKey: null,
    active: true,
    age: 28
  };

  it('pickBy retains only properties matching the predicate', () => {
    const numericFields = pickBy(user, (val) => typeof val === 'number');
    assert.deepEqual(numericFields, { id: 101, age: 28 });
  });

  it('omitBy strips properties matching the predicate (e.g. sensitive or nullish fields)', () => {
    const sanitized = omitBy(
      user,
      (val, key) => val === null || key.toLowerCase().includes('password')
    );
    assert.deepEqual(sanitized, {
      id: 101,
      username: 'whyst0ne',
      active: true,
      age: 28
    });
  });

  it('prevents prototype pollution keys (__proto__, constructor, prototype)', () => {
    const raw = JSON.parse('{"__proto__":{"polluted":true},"constructor":"bad","safe":"ok"}');
    const picked = pickBy(raw, () => true);

    assert.equal(({}).polluted, undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(picked, '__proto__'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(picked, 'constructor'), false);
    assert.deepEqual(picked, { safe: 'ok' });
  });

  it('returns an empty object for null, undefined, primitives, or arrays', () => {
    assert.deepEqual(pickBy(null), {});
    assert.deepEqual(omitBy(undefined), {});
    assert.deepEqual(pickBy([1, 2, 3]), {});
    assert.deepEqual(omitBy('str'), {});
  });
});
