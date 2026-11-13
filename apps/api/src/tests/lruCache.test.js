import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLRUCache } from '../utils/lruCache.js';

describe('Prototype-Safe LRU Cache with TTL (createLRUCache)', () => {
  it('stores and retrieves cached items and tracks hit/miss stats', () => {
    const cache = createLRUCache({ max: 3 });
    cache.set('a', 1).set('b', 2);

    assert.equal(cache.get('a'), 1);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), undefined);

    const stats = cache.getStats();
    assert.equal(stats.hits, 2);
    assert.equal(stats.misses, 1);
    assert.equal(stats.size, 2);
    assert.equal(stats.max, 3);
  });

  it('evicts least recently used items when exceeding capacity', () => {
    const cache = createLRUCache({ max: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    // Access 'a' so 'b' becomes least recently used
    assert.equal(cache.get('a'), 1);

    cache.set('c', 3);
    assert.equal(cache.has('a'), true);
    assert.equal(cache.has('b'), false);
    assert.equal(cache.get('c'), 3);
  });

  it('expires items automatically after TTL elapses', async () => {
    const cache = createLRUCache({ max: 5, ttl: 35 });
    cache.set('token', 'jwt_xyz');
    assert.equal(cache.get('token'), 'jwt_xyz');

    await new Promise((r) => setTimeout(r, 60));
    assert.equal(cache.has('token'), false);
    assert.equal(cache.get('token'), undefined);
  });

  it('blocks prototype pollution keys (__proto__, constructor, prototype)', () => {
    const cache = createLRUCache({ max: 5 });
    cache.set('__proto__', { polluted: true });
    cache.set('constructor', 'bad');
    cache.set('prototype', 'bad');

    assert.equal(cache.get('__proto__'), undefined);
    assert.equal(cache.has('constructor'), false);
    assert.equal(cache.size, 0);
  });

  it('supports .delete() and .clear()', () => {
    const cache = createLRUCache({ max: 5 });
    cache.set('k1', 10).set('k2', 20);
    assert.equal(cache.delete('k1'), true);
    assert.equal(cache.has('k1'), false);

    cache.clear();
    assert.equal(cache.size, 0);
    assert.equal(cache.getStats().hits, 0);
  });
});
