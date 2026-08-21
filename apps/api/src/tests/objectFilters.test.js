import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { pickBy, omitBy } from '../utils/objectFilters.js';

describe('pickBy & omitBy', () => {
  const sample = {
    a: 1,
    b: 'hello',
    c: null,
    d: undefined,
    e: 0,
    f: false,
    g: 42
  };

  test('pickBy filters properties matching predicate', () => {
    const numericOnly = pickBy(sample, (v) => typeof v === 'number');
    assert.deepEqual(numericOnly, { a: 1, e: 0, g: 42 });

    const truthyOnly = pickBy(sample);
    assert.deepEqual(truthyOnly, { a: 1, b: 'hello', g: 42 });
  });

  test('omitBy removes properties matching predicate', () => {
    const noNullish = omitBy(sample, (v) => v == null);
    assert.deepEqual(noNullish, { a: 1, b: 'hello', e: 0, f: false, g: 42 });

    const noNumbers = omitBy(sample, (v) => typeof v === 'number');
    assert.deepEqual(noNumbers, { b: 'hello', c: null, d: undefined, f: false });
  });

  test('protects against prototype pollution keys', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"polluted": true}, "safe": 123}');
    const picked = pickBy(malicious, () => true);
    assert.deepEqual(picked, { safe: 123 });
    assert.equal(({}).polluted, undefined);

    const omitted = omitBy(malicious, () => false);
    assert.deepEqual(omitted, { safe: 123 });
    assert.equal(({}).polluted, undefined);
  });

  test('handles null, undefined, and non-object inputs gracefully', () => {
    assert.deepEqual(pickBy(null), {});
    assert.deepEqual(pickBy(undefined), {});
    assert.deepEqual(pickBy('string'), {});
    assert.deepEqual(pickBy(123), {});

    assert.deepEqual(omitBy(null), {});
    assert.deepEqual(omitBy(undefined), {});
    assert.deepEqual(omitBy('string'), {});
    assert.deepEqual(omitBy(123), {});
  });
});
