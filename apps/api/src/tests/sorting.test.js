import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSorting } from '../utils/sorting.js';

describe('Query Sorting Parser Helper', () => {
  const allowed = ['id', 'title', 'budget', 'createdAt', 'rating'];

  it('returns default field and direction when no query params are provided', () => {
    const sort = parseSorting({}, allowed, 'createdAt', 'desc');
    assert.deepEqual(sort, { sortBy: 'createdAt', sortOrder: 'desc' });
  });

  it('accepts allowed field and valid sort order', () => {
    const sort = parseSorting({ sortBy: 'budget', sortOrder: 'asc' }, allowed);
    assert.deepEqual(sort, { sortBy: 'budget', sortOrder: 'asc' });
  });

  it('falls back to default field if an unapproved field is requested (anti-SQL-injection)', () => {
    const sort = parseSorting({ sortBy: 'password_hash; DROP TABLE users;', sortOrder: 'asc' }, allowed, 'createdAt');
    assert.deepEqual(sort, { sortBy: 'createdAt', sortOrder: 'asc' });
  });

  it('falls back to default order if an invalid sort direction is requested', () => {
    const sort = parseSorting({ sortBy: 'rating', sortOrder: 'invalid_direction' }, allowed, 'createdAt', 'desc');
    assert.deepEqual(sort, { sortBy: 'rating', sortOrder: 'desc' });
  });
});
