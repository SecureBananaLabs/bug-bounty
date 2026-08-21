import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePagination } from './pagination.js';

describe('parsePagination helper', () => {
  it('returns default take and skip when query is empty', () => {
    const result = parsePagination({});
    assert.deepEqual(result, { take: 20, skip: 0 });
  });

  it('parses valid take and skip parameters', () => {
    const result = parsePagination({ take: '15', skip: '30' });
    assert.deepEqual(result, { take: 15, skip: 30 });
  });

  it('supports limit and offset aliases', () => {
    const result = parsePagination({ limit: '10', offset: '20' });
    assert.deepEqual(result, { take: 10, skip: 20 });
  });

  it('clamps take exceeding maxTake to maxTake', () => {
    const result = parsePagination({ take: '100' }, 20, 50);
    assert.deepEqual(result, { take: 50, skip: 0 });
  });

  it('handles negative or NaN inputs safely', () => {
    const result = parsePagination({ take: '-5', skip: 'invalid' });
    assert.deepEqual(result, { take: 20, skip: 0 });
  });
});
