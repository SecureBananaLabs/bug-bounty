/**
 * @file clamp.test.js
 * Unit tests for safe numeric clamp utility.
 */

import assert from 'assert';
import { clamp } from '../utils/clamp.js';

function runTests() {
  console.log('Running clamp unit tests...');

  // Test 1: Value within normal bounds
  {
    assert.strictEqual(clamp(5, 0, 10), 5);
    assert.strictEqual(clamp(0, 0, 10), 0);
    assert.strictEqual(clamp(10, 0, 10), 10);
    console.log('✔ Test 1 passed: Values within range');
  }

  // Test 2: Value below min or above max
  {
    assert.strictEqual(clamp(-15, 0, 100), 0);
    assert.strictEqual(clamp(150, 0, 100), 100);
    console.log('✔ Test 2 passed: Clamping to min and max boundaries');
  }

  // Test 3: Inverted min and max bounds auto-corrected
  {
    assert.strictEqual(clamp(5, 10, 0), 5);
    assert.strictEqual(clamp(15, 10, 0), 10);
    assert.strictEqual(clamp(-5, 10, 0), 0);
    console.log('✔ Test 3 passed: Inverted min and max auto-correction');
  }

  // Test 4: NaN and non-numeric inputs fallback to defaultValue
  {
    assert.strictEqual(clamp(NaN, 1, 10, 5), 5);
    assert.strictEqual(clamp('invalid', 0, 100, 50), 50);
    assert.strictEqual(clamp(null, 10, 20), 10); // Number(null) is 0 -> clamped to 10
    console.log('✔ Test 4 passed: NaN and non-numeric fallback');
  }

  // Test 5: String numbers parsed correctly
  {
    assert.strictEqual(clamp('42', '10', '50'), 42);
    assert.strictEqual(clamp('99', '10', '50'), 50);
    console.log('✔ Test 5 passed: String numbers parsed accurately');
  }

  console.log('All clamp tests passed successfully!');
}

runTests();
