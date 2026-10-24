import test from 'node:test';
import assert from 'node:assert/strict';
import { safeGet } from '../utils/safeGet.js';

test('safeGet accesses shallow properties in simple objects', () => {
  const obj = { name: 'Alice', age: 30 };
  assert.equal(safeGet(obj, 'name'), 'Alice');
  assert.equal(safeGet(obj, 'age'), 30);
  assert.equal(safeGet(obj, 'missing', 'defaultVal'), 'defaultVal');
});

test('safeGet traverses deeply nested objects using dot notation', () => {
  const obj = {
    user: {
      profile: {
        location: {
          city: 'Istanbul',
          country: 'Turkey',
        },
      },
    },
  };
  assert.equal(safeGet(obj, 'user.profile.location.city'), 'Istanbul');
  assert.equal(safeGet(obj, 'user.profile.location.country'), 'Turkey');
  assert.equal(safeGet(obj, 'user.profile.location.postalCode', '34000'), '34000');
});

test('safeGet handles array indices in dot and bracket notation', () => {
  const data = {
    items: [
      { id: 101, title: 'Item 1' },
      { id: 102, title: 'Item 2' },
    ],
  };
  assert.equal(safeGet(data, 'items[0].id'), 101);
  assert.equal(safeGet(data, 'items[1].title'), 'Item 2');
  assert.equal(safeGet(data, 'items.0.title'), 'Item 1');
  assert.equal(safeGet(data, 'items[2].id', null), null);
});

test('safeGet supports array of path segments', () => {
  const nested = { a: { 'b.c': { d: 42 } } };
  assert.equal(safeGet(nested, ['a', 'b.c', 'd']), 42);
  assert.equal(safeGet(nested, ['a', 'nonexistent'], 'fallback'), 'fallback');
});

test('safeGet preserves falsy values without falling back to defaultValue', () => {
  const payload = {
    count: 0,
    isActive: false,
    text: '',
    empty: null,
  };
  assert.equal(safeGet(payload, 'count', 99), 0);
  assert.equal(safeGet(payload, 'isActive', true), false);
  assert.equal(safeGet(payload, 'text', 'placeholder'), '');
  assert.equal(safeGet(payload, 'empty', 'not-null'), null);
});

test('safeGet handles null or undefined targets gracefully', () => {
  assert.equal(safeGet(null, 'a.b.c', 'safe'), 'safe');
  assert.equal(safeGet(undefined, 'a.b.c', 'safe'), 'safe');
  assert.equal(safeGet({}, '', 'default'), 'default');
  assert.equal(safeGet({}, null, 'default'), 'default');
});

test('safeGet defends against prototype pollution attempts', () => {
  const sensitiveObj = {};

  // Attempting to access __proto__
  assert.equal(safeGet(sensitiveObj, '__proto__', 'defended'), 'defended');
  assert.equal(safeGet(sensitiveObj, 'a.__proto__.polluted', 'defended'), 'defended');

  // Attempting to access constructor
  assert.equal(safeGet(sensitiveObj, 'constructor', 'defended'), 'defended');
  assert.equal(safeGet(sensitiveObj, 'constructor.prototype', 'defended'), 'defended');
  assert.equal(safeGet(sensitiveObj, ['constructor', 'name'], 'defended'), 'defended');

  // Attempting to access prototype
  assert.equal(safeGet(sensitiveObj, 'prototype', 'defended'), 'defended');
  assert.equal(safeGet(sensitiveObj, 'user.prototype.polluted', 'defended'), 'defended');
});

test('safeGet supports Map instances in traversal path', () => {
  const map = new Map([
    ['user', { settings: { theme: 'dark' } }],
  ]);
  assert.equal(safeGet(map, 'user.settings.theme'), 'dark');
  assert.equal(safeGet(map, 'unknown.key', 'light'), 'light');
});

test('safeGet stops safely when encountering primitive in the middle of path', () => {
  const record = { a: 42 };
  assert.equal(safeGet(record, 'a.b.c', 'stop'), 'stop');
});

test('safeGet supports direct numeric and symbol paths', () => {
  const arr = ['alpha', 'beta', 'gamma'];
  assert.equal(safeGet(arr, 0), 'alpha');
  assert.equal(safeGet(arr, 1), 'beta');
  assert.equal(safeGet(arr, 2), 'gamma');
  assert.equal(safeGet(arr, 3, 'fallback'), 'fallback');

  const sym = Symbol('secret');
  const symObj = { [sym]: 'secure-value' };
  assert.equal(safeGet(symObj, sym), 'secure-value');
});
