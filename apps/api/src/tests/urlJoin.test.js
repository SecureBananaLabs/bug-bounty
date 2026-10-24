import test from 'node:test';
import assert from 'node:assert/strict';
import { urlJoin } from '../utils/urlJoin.js';

test('urlJoin joins URL path segments without duplicating slashes', () => {
  assert.equal(urlJoin('https://api.example.com/', '/v1//users/', '/profile'), 'https://api.example.com/v1/users/profile');
  assert.equal(urlJoin('/api/', '/jobs', '123'), '/api/jobs/123');
});

test('urlJoin preserves protocol prefixes correctly', () => {
  assert.equal(urlJoin('http://localhost:3000', 'health'), 'http://localhost:3000/health');
  assert.equal(urlJoin('https://domain.org/', '/test'), 'https://domain.org/test');
});

test('urlJoin appends query parameters with encoding', () => {
  const result = urlJoin('https://api.example.com', 'search', { q: 'react & node', page: 2 });
  assert.equal(result, 'https://api.example.com/search?q=react+%26+node&page=2');
});

test('urlJoin handles array query parameters and skips null/undefined', () => {
  const result = urlJoin('https://api.com', 'filter', { tags: ['dev', 'sec'], empty: null, undef: undefined });
  assert.equal(result, 'https://api.com/filter?tags=dev&tags=sec');
});

test('urlJoin defensively handles empty, non-string inputs', () => {
  assert.equal(urlJoin(), '');
  assert.equal(urlJoin(null, undefined), '');
  assert.equal(urlJoin('   ', ''), '');
});
