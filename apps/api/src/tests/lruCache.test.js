import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLRUCache, LRUCache } from '../utils/lruCache.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('LRU Cache utility (ref #743)', () => {
  it('instantiates via factory and class constructor', () => {
    const c1 = createLRUCache(3);
    assert.ok(c1 instanceof LRUCache);
    assert.equal(c1.capacity, 3);
    assert.equal(c1.size, 0);

    const c2 = new LRUCache(5);
    assert.equal(c2.capacity, 5);
  });

  it('validates constructor arguments defensively', () => {
    assert.throws(() => createLRUCache(0), TypeError);
    assert.throws(() => createLRUCache(-5), TypeError);
    assert.throws(() => createLRUCache(3.14), TypeError);
    assert.throws(() => createLRUCache(NaN), TypeError);
    assert.throws(() => createLRUCache('3'), TypeError);
    assert.throws(() => createLRUCache(3, 'invalid'), TypeError);
    assert.throws(() => createLRUCache(3, { ttl: -1 }), TypeError);
    assert.throws(() => createLRUCache(3, { ttl: 0 }), TypeError);
    assert.throws(() => createLRUCache(3, { ttl: '500' }), TypeError);
    assert.throws(() => createLRUCache(3, { onEvict: 123 }), TypeError);
  });

  it('performs basic set, get, has, peek, and delete operations', () => {
    const cache = createLRUCache(3);
    assert.equal(cache.set('a', 1), cache); // chainable
    cache.set('b', 2);

    assert.equal(cache.get('a'), 1);
    assert.equal(cache.peek('b'), 2);
    assert.equal(cache.has('a'), true);
    assert.equal(cache.has('c'), false);
    assert.equal(cache.get('nonexistent'), undefined);
    assert.equal(cache.peek('nonexistent'), undefined);

    assert.equal(cache.delete('a'), true);
    assert.equal(cache.delete('a'), false);
    assert.equal(cache.has('a'), false);
    assert.equal(cache.size, 1);
  });

  it('evicts least recently used items when capacity is reached', () => {
    const evicted = [];
    const cache = createLRUCache(3, {
      onEvict: (k, v, r) => evicted.push({ k, v, r })
    });

    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    assert.equal(cache.size, 3);

    // Evicts 'a' because it is oldest
    cache.set('d', 4);
    assert.equal(cache.has('a'), false);
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), 3);
    assert.equal(cache.get('d'), 4);

    assert.equal(evicted.length, 1);
    assert.deepEqual(evicted[0], { k: 'a', v: 1, r: 'evict' });
  });

  it('get updates recency so accessed item is preserved', () => {
    const cache = createLRUCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Access 'a' to make it most recently used; 'b' becomes oldest
    assert.equal(cache.get('a'), 1);
    cache.set('d', 4);

    assert.equal(cache.has('a'), true);
    assert.equal(cache.has('b'), false); // 'b' was evicted!
    assert.equal(cache.has('c'), true);
    assert.equal(cache.has('d'), true);
  });

  it('peek and has do not update recency', () => {
    const cache = createLRUCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Peek and has on 'a' should NOT mark 'a' as MRU
    assert.equal(cache.peek('a'), 1);
    assert.equal(cache.has('a'), true);

    cache.set('d', 4);
    // 'a' was still oldest and should be evicted
    assert.equal(cache.has('a'), false);
    assert.equal(cache.has('b'), true);
  });

  it('setting existing key updates value and recency', () => {
    const cache = createLRUCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Update 'a'
    cache.set('a', 10);
    cache.set('d', 4);

    // 'b' should be evicted, 'a' preserved with new value
    assert.equal(cache.get('a'), 10);
    assert.equal(cache.has('b'), false);
  });

  it('handles TTL expiration and item-level TTL override', async () => {
    const expired = [];
    const cache = createLRUCache(5, {
      ttl: 40,
      onEvict: (k, v, r) => expired.push({ k, v, r })
    });

    cache.set('fast', 1); // 40ms default TTL
    cache.set('long', 2, { ttl: 200 }); // override to 200ms

    assert.equal(cache.get('fast'), 1);
    assert.equal(cache.get('long'), 2);

    await sleep(60);

    // 'fast' is expired
    assert.equal(cache.has('fast'), false);
    assert.equal(cache.get('fast'), undefined);
    assert.equal(cache.peek('fast'), undefined);

    // 'long' is still active
    assert.equal(cache.has('long'), true);
    assert.equal(cache.get('long'), 2);

    assert.ok(expired.some((e) => e.k === 'fast' && e.r === 'expire'));
  });

  it('validates item-level options', () => {
    const cache = createLRUCache(3);
    assert.throws(() => cache.set('k', 'v', 'invalid'), TypeError);
    assert.throws(() => cache.set('k', 'v', { ttl: -1 }), TypeError);
    assert.throws(() => cache.set('k', 'v', { ttl: 0 }), TypeError);
    assert.throws(() => cache.set('k', 'v', { ttl: NaN }), TypeError);
  });

  it('supports prune() to clean expired items and return count', async () => {
    const cache = createLRUCache(5, { ttl: 30 });
    cache.set('a', 1);
    cache.set('b', 2);
    await sleep(40);
    assert.equal(cache.prune(), 2);
    assert.equal(cache.size, 0);
  });

  it('supports clear() and triggers onEvict with reason clear', () => {
    const cleared = [];
    const cache = createLRUCache(3, {
      onEvict: (k, v, r) => cleared.push({ k, v, r })
    });
    cache.set('x', 10);
    cache.set('y', 20);

    cache.clear();
    assert.equal(cache.size, 0);
    assert.equal(cache.get('x'), undefined);
    assert.equal(cleared.length, 2);
    assert.equal(cleared[0].r, 'clear');
    assert.equal(cleared[1].r, 'clear');
  });

  it('shields against prototype pollution on keys', () => {
    const cache = createLRUCache(5);

    cache.set('__proto__', { admin: true });
    cache.set('constructor', 'polluted-constructor');
    cache.set('prototype', 'polluted-prototype');

    assert.equal(Object.prototype.admin, undefined);
    assert.equal({}.admin, undefined);

    assert.equal(cache.has('__proto__'), true);
    assert.deepEqual(cache.get('__proto__'), { admin: true });
    assert.equal(cache.get('constructor'), 'polluted-constructor');
    assert.equal(cache.get('prototype'), 'polluted-prototype');

    assert.equal(cache.delete('__proto__'), true);
    assert.equal(cache.has('__proto__'), false);
    assert.equal(Object.prototype.admin, undefined);
  });

  it('survives exceptions thrown by onEvict callback (error boundary)', () => {
    const cache = createLRUCache(2, {
      onEvict: () => {
        throw new Error('evil evict listener crash');
      }
    });

    assert.doesNotThrow(() => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3); // triggers eviction of 'a'
      cache.delete('b'); // triggers eviction of 'b'
      cache.clear();
    });
  });

  it('operates correctly with capacity = 1', () => {
    const cache = createLRUCache(1);
    cache.set('a', 1);
    assert.equal(cache.get('a'), 1);
    cache.set('b', 2);
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.size, 1);
  });

  it('provides iterators for keys, values, and entries', () => {
    const cache = createLRUCache(4);
    cache.set('a', 10);
    cache.set('b', 20);
    cache.set('c', 30);

    assert.deepEqual(Array.from(cache.keys()), ['a', 'b', 'c']);
    assert.deepEqual(Array.from(cache.values()), [10, 20, 30]);
    assert.deepEqual(Array.from(cache.entries()), [
      ['a', 10],
      ['b', 20],
      ['c', 30]
    ]);
    assert.deepEqual(Array.from(cache), [
      ['a', 10],
      ['b', 20],
      ['c', 30]
    ]);
  });
});
