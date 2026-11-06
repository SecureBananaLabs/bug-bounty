import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneDeep } from '../utils/cloneDeep.js';

test('cloneDeep - primitive values', () => {
  assert.equal(cloneDeep(42), 42);
  assert.equal(cloneDeep('hello'), 'hello');
  assert.equal(cloneDeep(true), true);
  assert.equal(cloneDeep(false), false);
  assert.equal(cloneDeep(null), null);
  assert.equal(cloneDeep(undefined), undefined);
  assert.ok(Number.isNaN(cloneDeep(NaN)));
  assert.equal(cloneDeep(100n), 100n);
  const sym = Symbol('test');
  assert.equal(cloneDeep(sym), sym);
});

test('cloneDeep - plain objects and arrays deep isolation', () => {
  const original = {
    user: {
      id: 1,
      profile: {
        username: 'alice',
        tags: ['web3', 'defi']
      }
    },
    active: true
  };

  const copy = cloneDeep(original);

  assert.deepEqual(copy, original);
  assert.notEqual(copy, original);
  assert.notEqual(copy.user, original.user);
  assert.notEqual(copy.user.profile, original.user.profile);
  assert.notEqual(copy.user.profile.tags, original.user.profile.tags);

  // Mutation test
  copy.user.profile.tags.push('arb');
  copy.user.profile.username = 'bob';
  assert.equal(original.user.profile.username, 'alice');
  assert.equal(original.user.profile.tags.length, 2);
  assert.equal(copy.user.profile.tags.length, 3);
});

test('cloneDeep - Date and RegExp instances', () => {
  const originalDate = new Date('2026-10-23T12:00:00Z');
  const clonedDate = cloneDeep(originalDate);

  assert.equal(clonedDate instanceof Date, true);
  assert.equal(clonedDate.getTime(), originalDate.getTime());
  assert.notEqual(clonedDate, originalDate);

  // Mutating cloned date
  clonedDate.setFullYear(2030);
  assert.equal(originalDate.getFullYear(), 2026);
  assert.equal(clonedDate.getFullYear(), 2030);

  const originalRegex = /^[a-f0-9]{40}$/gi;
  const clonedRegex = cloneDeep(originalRegex);

  assert.equal(clonedRegex instanceof RegExp, true);
  assert.equal(clonedRegex.source, originalRegex.source);
  assert.equal(clonedRegex.flags, originalRegex.flags);
  assert.notEqual(clonedRegex, originalRegex);
});

test('cloneDeep - Map and Set data structures', () => {
  const originalMap = new Map();
  originalMap.set('chain', { id: 8453, name: 'Base' });
  originalMap.set('tokens', ['USDC', 'WETH']);

  const clonedMap = cloneDeep(originalMap);
  assert.equal(clonedMap instanceof Map, true);
  assert.notEqual(clonedMap, originalMap);
  assert.deepEqual(clonedMap.get('chain'), { id: 8453, name: 'Base' });
  assert.notEqual(clonedMap.get('chain'), originalMap.get('chain'));

  const originalSet = new Set([{ address: '0x1' }, { address: '0x2' }]);
  const clonedSet = cloneDeep(originalSet);
  assert.equal(clonedSet instanceof Set, true);
  assert.notEqual(clonedSet, originalSet);
  assert.equal(clonedSet.size, 2);
  const clonedEntries = Array.from(clonedSet);
  const originalEntries = Array.from(originalSet);
  assert.notEqual(clonedEntries[0], originalEntries[0]);
  assert.deepEqual(clonedEntries[0], originalEntries[0]);
});

test('cloneDeep - circular reference graphs', () => {
  const cyclicObj = { name: 'cycle' };
  cyclicObj.self = cyclicObj;
  cyclicObj.child = { parent: cyclicObj };

  const cloned = cloneDeep(cyclicObj);

  assert.equal(cloned.name, 'cycle');
  assert.notEqual(cloned, cyclicObj);
  assert.equal(cloned.self, cloned);
  assert.equal(cloned.child.parent, cloned);
  assert.notEqual(cloned.child, cyclicObj.child);
});

test('cloneDeep - Object.create(null) objects', () => {
  const nullProto = Object.create(null);
  nullProto.bounty = 800;
  nullProto.currency = 'USDC';

  const cloned = cloneDeep(nullProto);
  assert.equal(Object.getPrototypeOf(cloned), null);
  assert.equal(cloned.bounty, 800);
  assert.equal(cloned.currency, 'USDC');
  assert.notEqual(cloned, nullProto);
});

test('cloneDeep - prototype pollution defense', () => {
  const malicious = JSON.parse('{"__proto__": {"polluted": true}, "constructor": "evil", "valid": 123}');
  const cloned = cloneDeep(malicious);

  assert.equal(cloned.valid, 123);
  assert.equal(cloned.polluted, undefined);
  assert.equal(({}).polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});

test('cloneDeep - complex blockchain transaction payload', () => {
  const txPayload = {
    chainId: 8453,
    to: '0xE5Ab26877172254B72f3AE6DA5789D2468B7B282',
    data: '0xa9059cbb000000000000000000000000',
    receipt: {
      blockNumber: 18294721,
      logs: [
        { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', topics: ['0xddf252ad'] }
      ],
      gasUsed: 42100n
    },
    meta: {
      timestamp: new Date('2026-10-23T15:00:00Z'),
      validator: /0x[a-fA-F0-9]{40}/
    }
  };

  const cloned = cloneDeep(txPayload);
  assert.deepEqual(cloned, txPayload);
  assert.notEqual(cloned, txPayload);
  assert.notEqual(cloned.receipt, txPayload.receipt);
  assert.notEqual(cloned.receipt.logs[0], txPayload.receipt.logs[0]);
  assert.equal(cloned.receipt.gasUsed, 42100n);
  assert.equal(cloned.meta.timestamp.getTime(), txPayload.meta.timestamp.getTime());
});
