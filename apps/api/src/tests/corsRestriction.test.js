import assert from 'assert';
import { getCorsOptions } from '../middleware/cors.js';

async function runTests() {
  console.log('Running CORS restriction unit tests...');

  // Test 1: Allowed origin passes
  {
    const opts = getCorsOptions('https://app.example.com,https://admin.example.com');
    let result = null;
    opts.origin('https://app.example.com', (err, allowed) => { result = { err, allowed }; });
    assert.strictEqual(result.err, null);
    assert.strictEqual(result.allowed, true);
    console.log('✔ Test 1 passed: Allowed origin passes');
  }

  // Test 2: Disallowed origin rejected
  {
    const opts = getCorsOptions('https://app.example.com');
    let result = null;
    opts.origin('https://evil.com', (err, allowed) => { result = { err, allowed }; });
    assert.ok(result.err instanceof Error);
    assert.ok(result.err.message.includes('CORS'));
    console.log('✔ Test 2 passed: Disallowed origin rejected');
  }

  // Test 3: No origin (server-to-server) allowed
  {
    const opts = getCorsOptions('https://app.example.com');
    let result = null;
    opts.origin(undefined, (err, allowed) => { result = { err, allowed }; });
    assert.strictEqual(result.err, null);
    assert.strictEqual(result.allowed, true);
    console.log('✔ Test 3 passed: No-origin requests allowed');
  }

  // Test 4: Default origin is localhost:3000
  {
    const opts = getCorsOptions(undefined);
    let result = null;
    opts.origin('http://localhost:3000', (err, allowed) => { result = { err, allowed }; });
    assert.strictEqual(result.err, null);
    assert.strictEqual(result.allowed, true);
    console.log('✔ Test 4 passed: Default localhost origin accepted');
  }

  // Test 5: Credentials enabled
  {
    const opts = getCorsOptions('https://app.example.com');
    assert.strictEqual(opts.credentials, true);
    console.log('✔ Test 5 passed: Credentials enabled');
  }

  console.log('All CORS restriction tests passed successfully!');
}

runTests();
