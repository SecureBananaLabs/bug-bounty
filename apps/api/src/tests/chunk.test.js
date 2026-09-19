/**
 * @file chunk.test.js
 * Unit tests for chunk array partitioning utility.
 */

import assert from 'assert';
import { chunk } from '../utils/chunk.js';

function runTests() {
  console.log('Running chunk unit tests...');

  // Test 1: Evenly split array
  {
    const input = [1, 2, 3, 4, 5, 6];
    const res = chunk(input, 2);
    assert.deepStrictEqual(res, [[1, 2], [3, 4], [5, 6]]);
    console.log('✔ Test 1 passed: Evenly split array');
  }

  // Test 2: Uneven array with remaining trailing elements
  {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const res = chunk(input, 2);
    assert.deepStrictEqual(res, [['a', 'b'], ['c', 'd'], ['e']]);
    console.log('✔ Test 2 passed: Uneven trailing chunk');
  }

  // Test 3: Chunk size larger than array length
  {
    const input = [1, 2, 3];
    const res = chunk(input, 10);
    assert.deepStrictEqual(res, [[1, 2, 3]]);
    console.log('✔ Test 3 passed: Chunk size exceeding length');
  }

  // Test 4: Default size = 1
  {
    const input = [10, 20, 30];
    const res = chunk(input);
    assert.deepStrictEqual(res, [[10], [20], [30]]);
    console.log('✔ Test 4 passed: Default size parameter');
  }

  // Test 5: Fractional and string size normalization
  {
    const input = [1, 2, 3, 4];
    assert.deepStrictEqual(chunk(input, 2.8), [[1, 2], [3, 4]]);
    assert.deepStrictEqual(chunk(input, '2'), [[1, 2], [3, 4]]);
    console.log('✔ Test 5 passed: Fractional and string parameter normalization');
  }

  // Test 6: Sets and iterables support
  {
    const set = new Set(['x', 'y', 'z']);
    const res = chunk(set, 2);
    assert.deepStrictEqual(res, [['x', 'y'], ['z']]);
    console.log('✔ Test 6 passed: Iterables / Set support');
  }

  // Test 7: Invalid size bounds (0, negative, NaN) and empty inputs
  {
    assert.deepStrictEqual(chunk([1, 2], 0), []);
    assert.deepStrictEqual(chunk([1, 2], -5), []);
    assert.deepStrictEqual(chunk([1, 2], NaN), []);
    assert.deepStrictEqual(chunk([], 2), []);
    assert.deepStrictEqual(chunk(null, 2), []);
    assert.deepStrictEqual(chunk(undefined, 2), []);
    console.log('✔ Test 7 passed: Invalid bounds and empty input handling');
  }

  console.log('All chunk tests passed successfully!');
}

runTests();
