import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLRUCache } from '../utils/lruCache.js';

describe('Prototype-Safe LRU Cache with TTL', () => {
  it('stores and retrieves cached items', () => {
    const cache = createLRUCache({ max: 3 });
    cache.set('a', 1).set('b', 2);

    assert.equal(cache.get('a'), 1);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), undefined);
  });

  it('evicts least recently used items when exceeding capacity', () => {
    const cache = createLRUCache({ max: 2 });
    cache.set('x', 10);
    cache.set('y', 20);
    
    // Access x to make y least recently used
    cache.get('x');
    cache.set('z', 30);

    assert.equal(cache.get('x'), 10);
    assert.equal(cache.get('z'), 30);
    assert.equal(cache.get('y'), undefined); // Evicted
  });

  it('handles TTL expiration', async () => {
    const cache = createLRUCache({ max: 5, ttl: 50 });
    cache.set('temp', 'hello');

    assert.equal(cache.get('temp'), 'hello');
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(cache.get('temp'), undefined);
    assert.equal(cache.has('temp'), false);
  });

  it('protects against Prototype Pollution keys', () => {
    const cache = createLRUCache();
    cache.set('__proto__', { admin: true });
    cache.set('constructor', { admin: true });

    assert.equal(({}).admin, undefined);
    assert.equal(cache.get('__proto__'), undefined);
    assert.equal(cache.get('constructor'), undefined);
  });

  it('tracks hit/miss statistics accurately', () => {
    const cache = createLRUCache({ max: 2 });
    cache.set('k1', 'v1');

    cache.get('k1'); // hit
    cache.get('missing'); // miss

    const stats = cache.getStats();
    assert.equal(stats.hits, 1);
    assert.equal(stats.misses, 1);
    assert.equal(stats.hitRatio, 0.5);
  });
});
