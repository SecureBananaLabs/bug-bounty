/**
 * @file sorting.test.js
 * Unit tests for parseSorting utility.
 */

import assert from 'assert';
import { parseSorting } from '../utils/sorting.js';

function runTests() {
  console.log('Running parseSorting unit tests...');

  const allowed = ['createdAt', 'updatedAt', 'title', 'price', 'rating'];

  // Test 1: Defaults when query is empty or undefined
  {
    const res1 = parseSorting();
    assert.deepStrictEqual(res1, {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      field: 'createdAt',
      order: 'desc',
    });

    const res2 = parseSorting({}, allowed, 'title', 'asc');
    assert.deepStrictEqual(res2, {
      sortBy: 'title',
      sortOrder: 'asc',
      field: 'title',
      order: 'asc',
    });
    console.log('✔ Test 1 passed: Default fallback parameters');
  }

  // Test 2: Standard sortBy & sortOrder
  {
    const res = parseSorting({ sortBy: 'price', sortOrder: 'asc' }, allowed);
    assert.strictEqual(res.field, 'price');
    assert.strictEqual(res.order, 'asc');
    console.log('✔ Test 2 passed: Standard sortBy and sortOrder');
  }

  // Test 3: Aliases (orderBy / direction, sort / order)
  {
    const res1 = parseSorting({ orderBy: 'rating', direction: 'desc' }, allowed);
    assert.strictEqual(res1.field, 'rating');
    assert.strictEqual(res1.order, 'desc');

    const res2 = parseSorting({ sort: 'title', order: 'ascending' }, allowed);
    assert.strictEqual(res2.field, 'title');
    assert.strictEqual(res2.order, 'asc');
    console.log('✔ Test 3 passed: Parameter aliases and natural direction names');
  }

  // Test 4: Formats with prefix (-/+ or :)
  {
    const resMinus = parseSorting({ sort: '-price' }, allowed);
    assert.strictEqual(resMinus.field, 'price');
    assert.strictEqual(resMinus.order, 'desc');

    const resColon = parseSorting({ sort: 'rating:asc' }, allowed);
    assert.strictEqual(resColon.field, 'rating');
    assert.strictEqual(resColon.order, 'asc');
    console.log('✔ Test 4 passed: Minus/colon syntax parsing');
  }

  // Test 5: Reject invalid/unwhitelisted fields safely
  {
    const res = parseSorting({ sortBy: 'malicious_column; DROP TABLE users--', sortOrder: 'invalid_direction' }, allowed, 'createdAt', 'desc');
    assert.strictEqual(res.field, 'createdAt');
    assert.strictEqual(res.order, 'desc');
    console.log('✔ Test 5 passed: Whitelist security enforcement against unallowed fields');
  }

  console.log('All parseSorting tests passed successfully!');
}

runTests();
