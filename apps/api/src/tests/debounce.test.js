/**
 * @file debounce.test.js
 * Unit tests for debounce utility.
 */

import assert from 'assert';
import { debounce } from '../utils/debounce.js';

async function runTests() {
  console.log('Running debounce unit tests...');

  // Test 1: Standard trailing debounce delays invocation
  {
    let count = 0;
    const increment = debounce(() => { count++; }, 30);

    increment();
    increment();
    increment();

    assert.strictEqual(count, 0);
    assert.strictEqual(increment.pending(), true);

    await new Promise((r) => setTimeout(r, 60));

    assert.strictEqual(count, 1);
    assert.strictEqual(increment.pending(), false);
    console.log('✔ Test 1 passed: Standard trailing debounce');
  }

  // Test 2: Leading edge execution
  {
    let count = 0;
    const shoot = debounce(() => { count++; }, 40, { leading: true, trailing: false });

    shoot();
    assert.strictEqual(count, 1);

    shoot();
    shoot();
    assert.strictEqual(count, 1);

    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(count, 1);
    console.log('✔ Test 2 passed: Leading edge debounce');
  }

  // Test 3: Cancel prevents pending invocation
  {
    let count = 0;
    const save = debounce(() => { count++; }, 30);

    save();
    assert.strictEqual(save.pending(), true);
    save.cancel();
    assert.strictEqual(save.pending(), false);

    await new Promise((r) => setTimeout(r, 50));
    assert.strictEqual(count, 0);
    console.log('✔ Test 3 passed: Cancel prevents execution');
  }

  // Test 4: Flush immediately forces pending execution
  {
    let count = 0;
    const flushable = debounce((x) => { count += x; return count; }, 50);

    flushable(5);
    assert.strictEqual(count, 0);

    const res = flushable.flush();
    assert.strictEqual(count, 5);
    assert.strictEqual(res, 5);
    assert.strictEqual(flushable.pending(), false);
    console.log('✔ Test 4 passed: Flush forces immediate execution');
  }

  // Test 5: Validation on invalid fn input
  {
    assert.throws(() => debounce('not a function'), TypeError);
    console.log('✔ Test 5 passed: Invalid fn parameter validation');
  }

  console.log('All debounce tests passed successfully!');
}

runTests();
