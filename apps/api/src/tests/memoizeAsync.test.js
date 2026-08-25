const { memoizeAsync } = require('../utils/memoizeAsync');

// Helper to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('memoizeAsync', () => {
  let callCount;
  let memoizedFn;
  
  beforeEach(() => {
    callCount = 0;
    memoizedFn = memoizeAsync(async (x) => {
      callCount++;
      await delay(10); // Simulate async work
      return x * 2;
    }, { ttlMs: 1000 });
  });
  
  afterEach(() => {
    memoizedFn.clear();
  });

  describe('basic memoization', () => {
    test('should cache results for identical arguments', async () => {
      const result1 = await memoizedFn(5);
      const result2 = await memoizedFn(5);
      
      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(callCount).toBe(1); // Function called only once
    });

    test('should not cache results for different arguments', async () => {
      await memoizedFn(5);
      await memoizedFn(10);
      
      expect(callCount).toBe(2);
    });

    test('should handle multiple arguments', async () => {
      const multiArgFn = memoizeAsync(async (a, b, c) => {
        callCount++;
        return a + b + c;
      }, { ttlMs: 1000 });
      
      await multiArgFn(1, 2, 3);
      await multiArgFn(1, 2, 3);
      
      expect(callCount).toBe(1);
      multiArgFn.clear();
    });
  });

  describe('TTL expiration', () => {
    test('should expire cache after TTL', async () => {
      const shortTtlFn = memoizeAsync(async (x) => {
        callCount++;
        return x * 2;
      }, { ttlMs: 50 });
      
      await shortTtlFn(5);
      expect(callCount).toBe(1);
      
      // Wait for TTL to expire
      await delay(100);
      
      await shortTtlFn(5);
      expect(callCount).toBe(2); // Called again after expiration
      
      shortTtlFn.clear();
    });

    test('should not expire within TTL window', async () => {
      await memoizedFn(5);
      await delay(100); // Well within 1000ms TTL
      await memoizedFn(5);
      
      expect(callCount).toBe(1);
    });
  });

  describe('custom keyResolver', () => {
    test('should use custom key resolver', async () => {
      const customKeyFn = memoizeAsync(
        async (obj) => {
          callCount++;
          return obj.id;
        },
        {
          ttlMs: 1000,
          keyResolver: (obj) => `custom:${obj.id}`
        }
      );
      
      await customKeyFn({ id: 1, name: 'a' });
      await customKeyFn({ id: 1, name: 'b' }); // Different object, same id
      
      expect(callCount).toBe(1); // Same key due to custom resolver
      
      customKeyFn.clear();
    });

    test('should handle complex key resolution', async () => {
      const complexFn = memoizeAsync(
        async (user, options) => {
          callCount++;
          return { user: user.id, ...options };
        },
        {
          ttlMs: 1000,
          keyResolver: (user, options) => `${user.id}:${JSON.stringify(options)}`
        }
      );
      
      await complexFn({ id: 1 }, { include: ['posts'] });
      await complexFn({ id: 1 }, { include: ['posts'] });
      
      expect(callCount).toBe(1);
      
      await complexFn({ id: 1 }, { include: ['comments'] });
      expect(callCount).toBe(2);
      
      complexFn.clear();
    });
  });

  describe('cache invalidation', () => {
    test('clear() should remove all cached entries', async () => {
      await memoizedFn(1);
      await memoizedFn(2);
      await memoizedFn(3);
      
      expect(callCount).toBe(3);
      
      memoizedFn.clear();
      
      await memoizedFn(1);
      expect(callCount).toBe(4); // Called again after clear
    });

    test('deleteKey() should remove specific entry', async () => {
      await memoizedFn(1);
      await memoizedFn(2);
      
      expect(callCount).toBe(2);
      
      // Delete key for argument 1
      const key1 = JSON.stringify([1]);
      memoizedFn.deleteKey(key1);
      
      await memoizedFn(1); // Should re-execute
      await memoizedFn(2); // Should use cache
      
      expect(callCount).toBe(3);
    });

    test('deleteKey() should return true if key existed', async () => {
      await memoizedFn(5);
      const key = JSON.stringify([5]);
      
      const result = memoizedFn.deleteKey(key);
      expect(result).toBe(true);
    });

    test('deleteKey() should return false if key did not exist', async () => {
      const result = memoizedFn.deleteKey('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should not cache errors', async () => {
      let shouldFail = true;
      const errorFn = memoizeAsync(async (x) => {
        callCount++;
        if (shouldFail) throw new Error('Failed');
        return x * 2;
      }, { ttlMs: 1000 });
      
      await expect(errorFn(5)).rejects.toThrow('Failed');
      expect(callCount).toBe(1);
      
      shouldFail = false;
      const result = await errorFn(5);
      expect(result).toBe(10);
      expect(callCount).toBe(2); // Called again after error
      
      errorFn.clear();
    });

    test('should propagate errors correctly', async () => {
      const errorFn = memoizeAsync(async () => {
        throw new Error('Test error');
      }, { ttlMs: 1000 });
      
      await expect(errorFn()).rejects.toThrow('Test error');
      await expect(errorFn()).rejects.toThrow('Test error');
      
      errorFn.clear();
    });
  });

  describe('concurrent calls', () => {
    test('should handle concurrent calls for same key', async () => {
      let resolveFn;
      const promise = new Promise(resolve => { resolveFn = resolve; });
      
      let executing = false;
      const concurrentFn = memoizeAsync(async (x) => {
        if (executing) throw new Error('Concurrent execution detected');
        executing = true;
        callCount++;
        await promise;
        executing = false;
        return x * 2;
      }, { ttlMs: 1000 });
      
      // Start multiple concurrent calls
      const [result1, result2, result3] = await Promise.all([
        concurrentFn(5),
        concurrentFn(5),
        concurrentFn(5)
      ]);
      
      // All should get the same result
      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(result3).toBe(10);
      
      // Function should only execute once
      expect(callCount).toBe(1);
      
      resolveFn();
      concurrentFn.clear();
    });
  });

  describe('getStats', () => {
    test('should return cache statistics', async () => {
      await memoizedFn(1);
      await memoizedFn(2);
      
      const stats = memoizedFn.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.valid).toBe(2);
      expect(stats.expired).toBe(0);
      expect(stats.ttlMs).toBe(1000);
    });

    test('should track expired entries in stats', async () => {
      const shortTtlFn = memoizeAsync(async (x) => x * 2, { ttlMs: 50 });
      
      await shortTtlFn(1);
      await delay(100);
      
      const stats = shortTtlFn.getStats();
      expect(stats.expired).toBe(1);
      expect(stats.valid).toBe(0);
      
      shortTtlFn.clear();
    });
  });

  describe('default options', () => {
    test('should use default TTL of 60000ms when not specified', async () => {
      const defaultFn = memoizeAsync(async (x) => x * 2);
      
      await defaultFn(1);
      const stats = defaultFn.getStats();
      
      expect(stats.ttlMs).toBe(60000);
      
      defaultFn.clear();
    });

    test('should use default keyResolver when not specified', async () => {
      const defaultFn = memoizeAsync(async (x) => x * 2);
      
      await defaultFn(5);
      await defaultFn(5);
      
      expect(callCount).toBe(1);
      
      defaultFn.clear();
    });
  });

  describe('async function support', () => {
    test('should work with async functions returning promises', async () => {
      const asyncFn = memoizeAsync(async (x) => {
        callCount++;
        return Promise.resolve(x * 3);
      }, { ttlMs: 1000 });
      
      const result = await asyncFn(4);
      expect(result).toBe(12);
      
      const result2 = await asyncFn(4);
      expect(result2).toBe(12);
      expect(callCount).toBe(1);
      
      asyncFn.clear();
    });

    test('should work with async functions using await', async () => {
      const awaitFn = memoizeAsync(async (x) => {
        callCount++;
        await delay(5);
        return x + 10;
      }, { ttlMs: 1000 });
      
      const result = await awaitFn(5);
      expect(result).toBe(15);
      
      const result2 = await awaitFn(5);
      expect(result2).toBe(15);
      expect(callCount).toBe(1);
      
      awaitFn.clear();
    });
  });

  describe('memory management', () => {
    test('should not leak timers on clear', async () => {
      const fn = memoizeAsync(async (x) => x * 2, { ttlMs: 1000 });
      
      await fn(1);
      await fn(2);
      await fn(3);
      
      fn.clear();
      
      // Should be able to use after clear
      await fn(1);
      expect(callCount).toBe(4);
      
      fn.clear();
    });

    test('should not leak timers on deleteKey', async () => {
      const fn = memoizeAsync(async (x) => x * 2, { ttlMs: 1000 });
      
      await fn(1);
      await fn(2);
      
      fn.deleteKey(JSON.stringify([1]));
      
      await fn(1);
      expect(callCount).toBe(3);
      
      fn.clear();
    });
  });
});
