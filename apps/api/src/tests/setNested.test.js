import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setNested } from '../utils/setNested.js';

describe('Safe Deeply Nested Property Setter Utility', () => {
  it('sets a top-level property cleanly', () => {
    const obj = {};
    setNested(obj, 'title', 'Senior Architect');
    assert.equal(obj.title, 'Senior Architect');
  });

  it('creates intermediate objects when nested path does not exist', () => {
    const obj = {};
    setNested(obj, 'app.config.theme.mode', 'dark');
    assert.deepEqual(obj, { app: { config: { theme: { mode: 'dark' } } } });
  });

  it('preserves existing sibling keys during nested assignment', () => {
    const obj = { user: { name: 'Bob', age: 30 } };
    setNested(obj, 'user.email', 'bob@example.com');
    assert.equal(obj.user.name, 'Bob');
    assert.equal(obj.user.age, 30);
    assert.equal(obj.user.email, 'bob@example.com');
  });

  it('protects against Prototype Pollution attacks on nested paths', () => {
    const obj = {};
    setNested(obj, '__proto__.polluted', 'danger');
    setNested(obj, 'constructor.prototype.polluted', 'danger');
    assert.equal(({})['polluted'], undefined);
    assert.equal(obj['polluted'], undefined);
  });

  it('handles non-object inputs gracefully', () => {
    assert.equal(setNested(null, 'a.b', 1), null);
    assert.equal(setNested(123, 'a.b', 1), 123);
  });
});
