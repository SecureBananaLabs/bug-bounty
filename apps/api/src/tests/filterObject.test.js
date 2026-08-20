import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickBy, omitBy } from '../utils/filterObject.js';

describe('Prototype-Safe Object Filtering Utilities (pickBy & omitBy)', () => {
  const user = {
    id: 101,
    name: 'Alice',
    passwordHash: 'secret_hash_value',
    active: true,
    age: 28,
  };

  it('pickBy filters properties matching predicate', () => {
    const numericFields = pickBy(user, (val) => typeof val === 'number');
    assert.deepEqual(numericFields, { id: 101, age: 28 });
  });

  it('omitBy removes properties matching predicate', () => {
    const publicProfile = omitBy(user, (val, key) => key === 'passwordHash');
    assert.deepEqual(publicProfile, {
      id: 101,
      name: 'Alice',
      active: true,
      age: 28,
    });
  });

  it('protects against Prototype Pollution properties', () => {
    const malicious = JSON.parse('{"__proto__": "polluted", "name": "Bob"}');
    const picked = pickBy(malicious, () => true);
    assert.equal(({})['polluted'], undefined);
    assert.equal(picked.name, 'Bob');
  });

  it('handles null and primitive inputs cleanly', () => {
    assert.deepEqual(pickBy(null, () => true), {});
    assert.deepEqual(omitBy(undefined, () => true), {});
  });
});
