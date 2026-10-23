import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setNested } from '../utils/setNested.js';

describe('Safe Deeply Nested Property Setter Utility (setNested)', () => {
  it('sets a top-level property cleanly', () => {
    const obj = {};
    const res = setNested(obj, 'title', 'Senior Security Engineer');
    assert.equal(res, obj);
    assert.equal(obj.title, 'Senior Security Engineer');
  });

  it('creates intermediate objects when nested path does not exist', () => {
    const obj = {};
    setNested(obj, 'app.config.theme.mode', 'dark');
    assert.deepEqual(obj, {
      app: {
        config: {
          theme: {
            mode: 'dark'
          }
        }
      }
    });
  });

  it('supports array path segments and bracket notation', () => {
    const obj = {};
    setNested(obj, ['user', 'preferences', 'notifications'], true);
    setNested(obj, 'user.roles[0].name', 'admin');
    assert.equal(obj.user.preferences.notifications, true);
    assert.equal(obj.user.roles['0'].name, 'admin');
  });

  it('overwrites intermediate primitive values with plain objects when traversing deeper', () => {
    const obj = { a: 'primitive' };
    setNested(obj, 'a.b.c', 42);
    assert.deepEqual(obj, { a: { b: { c: 42 } } });
  });

  it('blocks prototype pollution via __proto__, constructor, and prototype keys', () => {
    const target = {};
    setNested(target, '__proto__.polluted', 'yes');
    setNested(target, 'a.__proto__.polluted', 'yes');
    setNested(target, 'constructor.prototype.polluted', 'yes');
    setNested(target, ['a', 'prototype', 'polluted'], 'yes');

    assert.equal({}.polluted, undefined);
    assert.equal(target.polluted, undefined);
  });

  it('gracefully handles null, primitives, and empty paths without throwing', () => {
    assert.equal(setNested(null, 'a.b', 1), null);
    assert.equal(setNested(undefined, 'a.b', 1), undefined);
    assert.equal(setNested('str', 'a.b', 1), 'str');

    const obj = { existing: true };
    assert.deepEqual(setNested(obj, '', 'noop'), { existing: true });
    assert.deepEqual(setNested(obj, [], 'noop'), { existing: true });
  });
});
