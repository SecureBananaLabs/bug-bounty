import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deepMerge } from '../utils/deepMerge.js';

describe('Prototype-Safe Deep Merge Utility', () => {
  it('merges shallow non-overlapping keys', () => {
    const target = { a: 1, b: 2 };
    const source = { c: 3 };
    assert.deepEqual(deepMerge(target, source), { a: 1, b: 2, c: 3 });
  });

  it('recursively merges nested object properties', () => {
    const target = {
      user: { name: 'Alice', settings: { theme: 'dark', notifications: true } },
    };
    const source = {
      user: { settings: { theme: 'light' }, role: 'admin' },
    };
    const expected = {
      user: { name: 'Alice', settings: { theme: 'light', notifications: true }, role: 'admin' },
    };
    assert.deepEqual(deepMerge(target, source), expected);
  });

  it('protects against Prototype Pollution vulnerabilities', () => {
    const maliciousPayload = JSON.parse('{"__proto__": {"polluted": "yes"}, "constructor": {"polluted": "yes"}}');
    const merged = deepMerge({}, maliciousPayload);
    assert.equal(({})['polluted'], undefined);
    assert.equal(merged['polluted'], undefined);
  });

  it('handles non-object and null targets/sources gracefully', () => {
    assert.deepEqual(deepMerge(null, { a: 1 }), { a: 1 });
    assert.deepEqual(deepMerge({ a: 1 }, null), { a: 1 });
    assert.deepEqual(deepMerge(undefined, undefined), {});
  });
});
