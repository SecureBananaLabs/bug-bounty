/**
 * @file searchValidation.test.js
 * Unit tests for search query parameter validator and controller handling.
 */

import assert from 'assert';
import {
  isValidSearchQuery,
  validateSearchQuery,
} from '../validators/search.js';

function runTests() {
  console.log('Running search validation unit tests...');

  // Test 1: Valid search queries (2 to 100 characters)
  {
    const validQueries = [
      'js',
      'react developer',
      'full-stack backend engineer',
      'a'.repeat(100),
      '  trimmed query  ',
    ];

    for (const q of validQueries) {
      assert.strictEqual(isValidSearchQuery(q), true, `Failed on valid query: ${q}`);
      const res = validateSearchQuery(q);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.q, q.trim());
    }
    console.log('✔ Test 1 passed: Valid search queries accepted and trimmed');
  }

  // Test 2: Invalid short queries (< 2 chars), empty, or oversized (> 100 chars)
  {
    const invalidQueries = [
      'a',
      '',
      ' ',
      '   ',
      'a'.repeat(101),
      null,
      undefined,
      123,
    ];

    for (const q of invalidQueries) {
      assert.strictEqual(isValidSearchQuery(q), false, `Should reject invalid query: ${q}`);
      const res = validateSearchQuery(q);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, "Search query 'q' must be at least 2 characters");
    }
    console.log('✔ Test 2 passed: Invalid, empty, or oversized queries rejected with error');
  }

  console.log('All search validation tests passed successfully!');
}

runTests();
