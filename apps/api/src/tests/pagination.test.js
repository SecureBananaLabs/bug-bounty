/**
 * @file pagination.test.js
 * Unit tests for parsePagination utility.
 */

import assert from 'assert';
import { parsePagination } from '../utils/pagination.js';

function runTests() {
  console.log('Running pagination unit tests...');

  // Test 1: Default fallback values when query is empty or undefined
  {
    const res1 = parsePagination();
    assert.deepStrictEqual(res1, { take: 20, skip: 0, limit: 20, offset: 0, page: 1 });

    const res2 = parsePagination({});
    assert.deepStrictEqual(res2, { take: 20, skip: 0, limit: 20, offset: 0, page: 1 });
    console.log('✔ Test 1 passed: Empty and default query parameters');
  }

  // Test 2: Standard take & skip parameters
  {
    const res = parsePagination({ take: 10, skip: 30 });
    assert.deepStrictEqual(res, { take: 10, skip: 30, limit: 10, offset: 30, page: 4 });
    console.log('✔ Test 2 passed: Standard take and skip parameters');
  }

  // Test 3: Standard limit & offset aliases
  {
    const res = parsePagination({ limit: '15', offset: '45' });
    assert.deepStrictEqual(res, { take: 15, skip: 45, limit: 15, offset: 45, page: 4 });
    console.log('✔ Test 3 passed: Limit and offset alias support');
  }

  // Test 4: Page and pageSize calculation
  {
    const res = parsePagination({ page: 3, pageSize: 25 });
    assert.deepStrictEqual(res, { take: 25, skip: 50, limit: 25, offset: 50, page: 3 });
    console.log('✔ Test 4 passed: Page and pageSize derivation');
  }

  // Test 5: Clamping to maximum limit bounds and floor normalization
  {
    const res = parsePagination({ take: 500, skip: -10 }, 20, 50);
    assert.strictEqual(res.take, 50);
    assert.strictEqual(res.skip, 0);

    const floatRes = parsePagination({ take: '12.8', skip: '4.2' });
    assert.strictEqual(floatRes.take, 12);
    assert.strictEqual(floatRes.skip, 4);
    console.log('✔ Test 5 passed: Upper limit clamping and float truncation');
  }

  // Test 6: Invalid and non-numeric inputs
  {
    const res = parsePagination({ take: 'invalid', skip: 'bad', page: -5 });
    assert.strictEqual(res.take, 20);
    assert.strictEqual(res.skip, 0);
    console.log('✔ Test 6 passed: NaN and invalid query parameters safe fallback');
  }

  console.log('All pagination tests passed successfully!');
}

runTests();
