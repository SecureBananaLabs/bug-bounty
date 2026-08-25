const pLimit = require('../utils/pLimit');

// Helper to create a delayed promise
const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

// Helper to create a failing promise
const fail = (ms, error) => new Promise((_, reject) => setTimeout(() => reject(error), ms));

describe('pLimit', () => {
  describe('basic functionality', () => {
    test('should limit concurrency', async () => {
      const limit = pLimit(2);
      let concurrent = 0;
      let maxConcurrent = 0;

      const task = () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        return delay(50).then(() => {
          concurrent--;
        });
      };

      await Promise.all([
        limit(task),
        limit(task),
        limit(task),
        limit(task),
      ]);

      expect(maxConcurrent).toBe(2);
    });

    test('should execute all tasks', async () => {
      const limit = pLimit(3);
      const results = [];

      for (let i = 0; i < 10; i++) {
        limit(() => delay(10, i)).then((v) => results.push(v));
      }

      await delay(200);
      expect(results.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('should return resolved values', async () => {
      const limit = pLimit(2);
      const result = await limit(() => Promise.resolve('hello'));
      expect(result).toBe('hello');
    });

    test('should propagate rejected promises', async () => {
      const limit = pLimit(2);
      await expect(limit(() => Promise.reject(new Error('fail')))).rejects.toThrow('fail');
    });
  });

  describe('activeCount', () => {
    test('should track active count correctly', async () => {
      const limit = pLimit(2);
      expect(limit.activeCount()).toBe(0);

      const p1 = limit(() => delay(100));
      expect(limit.activeCount()).toBe(1);

      const p2 = limit(() => delay(100));
      expect(limit.activeCount()).toBe(2);

      const p3 = limit(() => delay(100));
      expect(limit.activeCount()).toBe(2); // Still 2, third is queued

      await Promise.all([p1, p2, p3]);
      expect(limit.activeCount()).toBe(0);
    });

    test('should decrement active count on rejection', async () => {
      const limit = pLimit(2);
      const p1 = limit(() => delay(50));
      const p2 = limit(() => fail(50, new Error('fail')));

      expect(limit.activeCount()).toBe(2);

      await Promise.allSettled([p1, p2]);
      expect(limit.activeCount()).toBe(0);
    });
  });

  describe('pendingCount', () => {
    test('should track pending count correctly', async () => {
      const limit = pLimit(1);
      expect(limit.pendingCount()).toBe(0);

      const p1 = limit(() => delay(100));
      expect(limit.pendingCount()).toBe(0);

      const p2 = limit(() => delay(100));
      expect(limit.pendingCount()).toBe(1);

      const p3 = limit(() => delay(100));
      expect(limit.pendingCount()).toBe(2);

      await Promise.all([p1, p2, p3]);
      expect(limit.pendingCount()).toBe(0);
    });

    test('should return 0 when no tasks queued', () => {
      const limit = pLimit(5);
      expect(limit.pendingCount()).toBe(0);
    });
  });

  describe('clearQueue', () => {
    test('should reject all pending promises', async () => {
      const limit = pLimit(1);
      const p1 = limit(() => delay(100));
      const p2 = limit(() => delay(100));
      const p3 = limit(() => delay(100));

      expect(limit.pendingCount()).toBe(2);

      limit.clearQueue(new Error('cleared'));

      await expect(p1).resolves.toBeUndefined(); // First one already running
      await expect(p2).rejects.toThrow('cleared');
      await expect(p3).rejects.toThrow('cleared');
      expect(limit.pendingCount()).toBe(0);
    });

    test('should use default error if none provided', async () => {
      const limit = pLimit(1);
      limit(() => delay(100));
      const p2 = limit(() => delay(100));

      limit.clearQueue();

      await expect(p2).rejects.toThrow('Queue cleared');
    });
  });

  describe('edge cases', () => {
    test('should throw on invalid concurrency', () => {
      expect(() => pLimit(0)).toThrow('Expected `concurrency` to be an integer >= 1');
      expect(() => pLimit(-1)).toThrow('Expected `concurrency` to be an integer >= 1');
      expect(() => pLimit(1.5)).toThrow('Expected `concurrency` to be an integer >= 1');
      expect(() => pLimit('2')).toThrow('Expected `concurrency` to be an integer >= 1');
      expect(() => pLimit(Infinity)).toThrow('Expected `concurrency` to be an integer >= 1');
    });

    test('should handle concurrency of 1 (serial execution)', async () => {
      const limit = pLimit(1);
      const order = [];

      await Promise.all([
        limit(() => delay(50).then(() => order.push(1))),
        limit(() => delay(30).then(() => order.push(2))),
        limit(() => delay(10).then(() => order.push(3))),
      ]);

      expect(order).toEqual([1, 2, 3]);
    });

    test('should handle synchronous functions', async () => {
      const limit = pLimit(2);
      const result = await limit(() => 'sync value');
      expect(result).toBe('sync value');
    });

    test('should handle throwing synchronous functions', async () => {
      const limit = pLimit(2);
      await expect(limit(() => { throw new Error('sync error'); })).rejects.toThrow('sync error');
    });

    test('should handle multiple limiters independently', async () => {
      const limit1 = pLimit(1);
      const limit2 = pLimit(2);

      let active1 = 0, maxActive1 = 0;
      let active2 = 0, maxActive2 = 0;

      const task1 = () => {
        active1++;
        maxActive1 = Math.max(maxActive1, active1);
        return delay(50).then(() => active1--);
      };

      const task2 = () => {
        active2++;
        maxActive2 = Math.max(maxActive2, active2);
        return delay(50).then(() => active2--);
      };

      await Promise.all([
        limit1(task1),
        limit1(task1),
        limit2(task2),
        limit2(task2),
        limit2(task2),
      ]);

      expect(maxActive1).toBe(1);
      expect(maxActive2).toBe(2);
    });
  });

  describe('stress test', () => {
    test('should handle many tasks with high concurrency', async () => {
      const limit = pLimit(10);
      const taskCount = 100;
      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const tasks = Array.from({ length: taskCount }, (_, i) =>
        limit(() => {
          currentConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
          return delay(Math.random() * 20).then(() => {
            currentConcurrent--;
            return i;
          });
        })
      );

      const results = await Promise.all(tasks);
      expect(results.sort((a, b) => a - b)).toEqual(Array.from({ length: taskCount }, (_, i) => i));
      expect(maxConcurrent).toBeLessThanOrEqual(10);
      expect(maxConcurrent).toBeGreaterThan(0);
    });
  });
});
