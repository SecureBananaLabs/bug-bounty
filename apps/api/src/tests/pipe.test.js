/**
 * @file pipe.test.js
 * Unit tests for pipe and pipeAsync pipeline helpers.
 */

import assert from 'assert';
import { pipe, pipeAsync } from '../utils/pipe.js';

async function runTests() {
  console.log('Running pipe and pipeAsync unit tests...');

  // Test 1: Synchronous pipeline transformation
  {
    const trim = (str) => str.trim();
    const lowercase = (str) => str.toLowerCase();
    const wrap = (str) => `<${str}>`;

    const normalize = pipe(trim, lowercase, wrap);
    const result = normalize('   Mattermost & Brave  ');
    assert.strictEqual(result, '<mattermost & brave>');
    console.log('✔ Test 1 passed: Synchronous pipeline transformation');
  }

  // Test 2: Mathematical pipeline
  {
    const double = (n) => n * 2;
    const addTen = (n) => n + 10;
    const square = (n) => n * n;

    const compute = pipe(double, addTen, square);
    // (5 * 2) = 10 -> 10 + 10 = 20 -> 20 * 20 = 400
    assert.strictEqual(compute(5), 400);
    console.log('✔ Test 2 passed: Mathematical pipeline');
  }

  // Test 3: Asynchronous pipeline transformation
  {
    const fetchUser = async (id) => ({ id, name: 'Alice' });
    const addRole = async (user) => ({ ...user, role: 'admin' });
    const serialize = async (user) => JSON.stringify(user);

    const processUser = pipeAsync(fetchUser, addRole, serialize);
    const result = await processUser(101);
    assert.strictEqual(result, JSON.stringify({ id: 101, name: 'Alice', role: 'admin' }));
    console.log('✔ Test 3 passed: Asynchronous pipeline transformation');
  }

  // Test 4: Mixed synchronous and asynchronous pipeline
  {
    const step1 = (x) => x + 'A';
    const step2 = async (x) => x + 'B';
    const step3 = (x) => x + 'C';

    const pipeline = pipeAsync(step1, step2, step3);
    const result = await pipeline('Start-');
    assert.strictEqual(result, 'Start-ABC');
    console.log('✔ Test 4 passed: Mixed sync/async pipeline');
  }

  // Test 5: Empty pipelines return identity
  {
    const emptySync = pipe();
    assert.strictEqual(emptySync(42), 42);

    const emptyAsync = pipeAsync();
    assert.strictEqual(await emptyAsync('test'), 'test');
    console.log('✔ Test 5 passed: Empty pipeline identity returns');
  }

  // Test 6: Invalid argument throws TypeError
  {
    const badSync = pipe((x) => x, 'not a function');
    assert.throws(() => badSync(1), TypeError);

    const badAsync = pipeAsync((x) => x, 123);
    await assert.rejects(async () => await badAsync(1), TypeError);
    console.log('✔ Test 6 passed: TypeError on non-function pipeline argument');
  }

  console.log('All pipe and pipeAsync tests passed successfully!');
}

runTests();
