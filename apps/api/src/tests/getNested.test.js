import test from 'node:test';
import assert from 'node:assert/strict';
import { getNested } from '../utils/getNested.js';

test('getNested - accesses deeply nested properties with dot notation', () => {
  const data = {
    user: {
      profile: {
        name: 'Alice',
        settings: {
          theme: 'dark'
        }
      }
    }
  };

  assert.equal(getNested(data, 'user.profile.name'), 'Alice');
  assert.equal(getNested(data, 'user.profile.settings.theme'), 'dark');
});

test('getNested - accesses nested properties with array path', () => {
  const data = {
    account: {
      balances: {
        usd: 1250.75
      }
    }
  };

  assert.equal(getNested(data, ['account', 'balances', 'usd']), 1250.75);
  assert.equal(getNested(data, ['account', 'missing']), undefined);
});

test('getNested - accesses array elements with bracket notation and index paths', () => {
  const data = {
    transactions: [
      { id: 'tx-1', amount: 100 },
      { id: 'tx-2', amount: 250, metadata: { status: 'confirmed' } }
    ],
    matrix: [[1, 2], [3, 4]]
  };

  assert.equal(getNested(data, 'transactions[0].id'), 'tx-1');
  assert.equal(getNested(data, 'transactions[1].metadata.status'), 'confirmed');
  assert.equal(getNested(data, ['transactions', 1, 'amount']), 250);
  assert.equal(getNested(data, 'matrix[1][0]'), 3);
  assert.equal(getNested(data, ['matrix', 0, 1]), 2);
});

test('getNested - returns defaultValue when property is missing or undefined', () => {
  const data = { a: { b: 1 } };

  assert.equal(getNested(data, 'a.c'), undefined);
  assert.equal(getNested(data, 'a.c', 'fallback'), 'fallback');
  assert.equal(getNested(data, 'nonexistent.deep.path', 999), 999);
  assert.deepEqual(getNested(data, 'a.missing.obj', { default: true }), { default: true });
});

test('getNested - preserves all falsy values accurately without falling back', () => {
  const data = {
    zero: 0,
    emptyStr: '',
    boolFalse: false,
    nullVal: null,
    nested: {
      zero: 0,
      emptyStr: '',
      boolFalse: false,
      nullVal: null
    }
  };

  assert.equal(getNested(data, 'zero', 100), 0);
  assert.equal(getNested(data, 'emptyStr', 'default'), '');
  assert.equal(getNested(data, 'boolFalse', true), false);
  assert.equal(getNested(data, 'nullVal', 'default'), null);

  assert.equal(getNested(data, 'nested.zero', 100), 0);
  assert.equal(getNested(data, 'nested.emptyStr', 'default'), '');
  assert.equal(getNested(data, 'nested.boolFalse', true), false);
  assert.equal(getNested(data, 'nested.nullVal', 'default'), null);
});

test('getNested - strictly prevents prototype pollution and prototype leakage', () => {
  const data = { a: 1 };

  // Attempts to traverse __proto__, constructor, prototype
  assert.equal(getNested(data, '__proto__', 'safe'), 'safe');
  assert.equal(getNested(data, '__proto__.polluted', 'safe'), 'safe');
  assert.equal(getNested(data, 'constructor', 'safe'), 'safe');
  assert.equal(getNested(data, 'constructor.prototype', 'safe'), 'safe');
  assert.equal(getNested(data, 'prototype', 'safe'), 'safe');
  assert.equal(getNested(data, ['__proto__'], 'safe'), 'safe');
  assert.equal(getNested(data, ['constructor', 'name'], 'safe'), 'safe');

  // Attempts to leak built-in prototype methods without own property
  assert.equal(getNested(data, 'toString', 'safe'), 'safe');
  assert.equal(getNested(data, 'valueOf', 'safe'), 'safe');
  assert.equal(getNested(data, 'hasOwnProperty', 'safe'), 'safe');
  assert.equal(getNested(data, 'isPrototypeOf', 'safe'), 'safe');
  assert.equal(getNested(data, 'toString.call', 'safe'), 'safe');
  assert.equal(getNested([1, 2], 'slice', 'safe'), 'safe');
  assert.equal(getNested([1, 2], 'map', 'safe'), 'safe');

  // Explicit own property with prototype method name is preserved
  assert.equal(getNested({ toString: 'custom' }, 'toString', 'safe'), 'custom');
});

test('getNested - handles null, undefined, and primitive object targets safely', () => {
  assert.equal(getNested(null, 'a.b', 'def'), 'def');
  assert.equal(getNested(undefined, 'a.b', 'def'), 'def');
  assert.equal(getNested(42, 'a.b', 'def'), 'def');
  assert.equal(getNested(true, 'a.b', 'def'), 'def');
  assert.equal(getNested('hello', 'length'), 5);
  assert.equal(getNested('hello', 'invalid', 'def'), 'def');
});

test('getNested - handles empty and invalid paths gracefully', () => {
  const data = { a: 1 };

  assert.equal(getNested(data, '', 'def'), 'def');
  assert.equal(getNested(data, [], 'def'), 'def');
  assert.equal(getNested(data, null, 'def'), 'def');
  assert.equal(getNested(data, undefined, 'def'), 'def');
});

test('getNested - works with Object.create(null) dictionary objects', () => {
  const nullProto = Object.create(null);
  nullProto.foo = { bar: 'baz' };

  assert.equal(getNested(nullProto, 'foo.bar'), 'baz');
  assert.equal(getNested(nullProto, 'foo.missing', 'none'), 'none');
});

test('getNested - extracts complex real-world blockchain event payload safely', () => {
  const webhook = {
    event: 'TRANSFER',
    transaction: {
      hash: '0xabc123',
      receipt: {
        logs: [
          { address: '0xcontract1', topics: ['0xddf252ad'] },
          { address: '0xcontract2', topics: ['0xapproval'] }
        ],
        gasUsed: '21000'
      }
    }
  };

  assert.equal(getNested(webhook, 'transaction.receipt.logs[0].address'), '0xcontract1');
  assert.equal(getNested(webhook, ['transaction', 'receipt', 'logs', 1, 'topics', 0]), '0xapproval');
  assert.equal(getNested(webhook, 'transaction.receipt.logs[5].address', 'none'), 'none');
  assert.equal(getNested(webhook, 'transaction.error.message', null), null);
});
