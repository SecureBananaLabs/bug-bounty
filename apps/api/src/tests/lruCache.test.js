import { createLRUCache } from '../utils/lruCache';

describe('LRUCache', () => {
  test('should store and retrieve values', () => {
    const cache = createLRUCache({ capacity: 10 });
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('should respect capacity (eviction)', () => {
    const cache = createLRUCache({ capacity: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  test('should respect TTL', () => {
    const cache = createLRUCache({ capacity: 10, ttl: 100 });
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
    
    // Wait for TTL to expire
    // Using a synchronous delay for test simplicity if possible, 
    // but here we just use a small timeout logic
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(cache.get('key')).toBeUndefined();
        resolve();
      }, 150);
    });
  });

  test('should guard against prototype pollution', () => {
    const cache = createLRUCache({ capacity: 10 });
    cache.set('__proto__', 'polluted');
    cache.set('constructor', 'polluted');
    
    expect(cache.get('__proto__')).toBeUndefined();
    expect(cache.get('constructor')).toBeUndefined();
  });

  test('should track stats', () => {
    const cache = createLRUCache({ capacity: 10 });
    cache.set('a', 1);
    cache.get('a'); // hit
    cache.get('b'); // miss
    
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  test('should handle delete and clear', () => {
    const cache = createLRUCache({ capacity: 10 });
    cache.set('a', 1);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('b')).toBeUndefined();
  });
});
