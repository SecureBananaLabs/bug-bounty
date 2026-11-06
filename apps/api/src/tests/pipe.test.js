import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pipe, pipeAsync } from '../utils/pipe.js';

describe('Functional Pipeline Composition Helpers (pipe & pipeAsync)', () => {
  it('composes synchronous functions sequentially left-to-right', () => {
    const normalizeUsername = pipe(
      (s) => String(s).trim(),
      (s) => s.toLowerCase(),
      (s) => s.replace(/\s+/g, '_')
    );

    assert.equal(normalizeUsername('  Alice Wonderland  '), 'alice_wonderland');
  });

  it('returns identity function when pipe() is called with no arguments', () => {
    const identity = pipe();
    const obj = { id: 42 };
    assert.equal(identity(obj), obj);
  });

  it('composes asynchronous and synchronous stages sequentially in pipeAsync()', async () => {
    const enrichOrder = pipeAsync(
      (amount) => amount * 2,
      async (doubled) => {
        await new Promise((r) => setTimeout(r, 10));
        return doubled + 15;
      },
      (total) => ({ total, status: 'verified' })
    );

    const res = await enrichOrder(50);
    assert.deepEqual(res, { total: 115, status: 'verified' });
  });

  it('throws TypeError when non-function arguments are provided to pipe or pipeAsync', () => {
    assert.throws(() => pipe((x) => x, 'invalid'), TypeError);
    assert.throws(() => pipeAsync(null), TypeError);
  });
});
