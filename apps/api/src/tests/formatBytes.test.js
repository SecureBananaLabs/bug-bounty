/**
 * @file formatBytes.test.js
 * Unit tests for formatBytes utility.
 */

import assert from 'assert';
import { formatBytes } from '../utils/formatBytes.js';

function runTests() {
  console.log('Running formatBytes unit tests...');

  // Test 1: Zero and edge cases
  {
    assert.strictEqual(formatBytes(0), '0 B');
    assert.strictEqual(formatBytes('0'), '0 B');
    assert.strictEqual(formatBytes(null), '0 B');
    assert.strictEqual(formatBytes(undefined), '0 B');
    assert.strictEqual(formatBytes(NaN), '0 B');
    console.log('✔ Test 1 passed: Zero and null/NaN edge cases');
  }

  // Test 2: Exact binary powers (1024, 1048576, etc.)
  {
    assert.strictEqual(formatBytes(500), '500 B');
    assert.strictEqual(formatBytes(1024), '1 KB');
    assert.strictEqual(formatBytes(1024 * 1024), '1 MB');
    assert.strictEqual(formatBytes(1024 * 1024 * 1024), '1 GB');
    assert.strictEqual(formatBytes(1024 * 1024 * 1024 * 1024), '1 TB');
    console.log('✔ Test 2 passed: Exact power transitions');
  }

  // Test 3: Decimal formatting and custom precision
  {
    assert.strictEqual(formatBytes(1536), '1.5 KB');
    assert.strictEqual(formatBytes(1536, 0), '2 KB');
    assert.strictEqual(formatBytes(1572864, 2), '1.5 MB');
    assert.strictEqual(formatBytes(123456789, 3), '117.738 MB');
    console.log('✔ Test 3 passed: Decimal rounding and precision options');
  }

  // Test 4: Negative values
  {
    assert.strictEqual(formatBytes(-1024), '-1 KB');
    assert.strictEqual(formatBytes(-1536), '-1.5 KB');
    console.log('✔ Test 4 passed: Negative values supported');
  }

  // Test 5: String numbers handled cleanly
  {
    assert.strictEqual(formatBytes('2048'), '2 KB');
    assert.strictEqual(formatBytes('10485760'), '10 MB');
    console.log('✔ Test 5 passed: String inputs parsed');
  }

  console.log('All formatBytes tests passed successfully!');
}

runTests();
