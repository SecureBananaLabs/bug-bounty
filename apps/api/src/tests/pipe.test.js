import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pipe, pipeAsync } from '../utils/pipe.js';

describe('Pipeline Composition Helpers (pipe & pipeAsync)', () => {
  it('chains synchronous functions sequentially with pipe()', () => {
    const trim = (str) => str.trim();
    const toLower = (str) => str.toLowerCase();
    const exclaim = (str) => `${str}!`;

    const transform = pipe(trim, toLower, exclaim);
    assert.equal(transform('   HELLO WORLD   '), 'hello world!');
  });

  it('chains asynchronous transformations sequentially with pipeAsync()', async () => {
    const doubleAsync = async (n) => n * 2;
    const addFiveAsync = async (n) => n + 5;
    const formatAsync = async (n) => `Result: ${n}`;

    const pipeline = pipeAsync(doubleAsync, addFiveAsync, formatAsync);
    const result = await pipeline(10);
    assert.equal(result, 'Result: 25');
  });

  it('throws TypeError if any stage is not a function', () => {
    assert.throws(() => pipe(null)(10), { name: 'TypeError' });
  });
});
