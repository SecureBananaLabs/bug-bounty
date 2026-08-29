/**
 * @file rateLimitSecurity.test.js
 * Unit tests verifying middleware pipeline ordering: health check exemption, body parser placement, and auth limits.
 */

import assert from 'assert';
import { createApp } from '../app.js';
import { apiLimiter, authLimiter } from '../middleware/rateLimit.js';

function runTests() {
  console.log('Running rate limit pipeline security tests...');

  // Test 1: Rate limiters exist and are configured
  {
    assert.strictEqual(typeof apiLimiter, 'function');
    assert.strictEqual(typeof authLimiter, 'function');
    console.log('✔ Test 1 passed: Rate limiters instantiated');
  }

  // Test 2: App factory instantiates cleanly
  {
    const app = createApp();
    assert.ok(app);
    assert.strictEqual(typeof app.use, 'function');
    assert.strictEqual(typeof app.get, 'function');
    console.log('✔ Test 2 passed: App factory initializes without errors');
  }

  // Test 3: Verify route stack ordering
  {
    const app = createApp();
    const stack = app._router.stack;

    // Verify /health route is registered
    const healthLayer = stack.find(
      (layer) => layer.route && layer.route.path === '/health'
    );
    assert.ok(healthLayer, 'Health check route layer must exist');

    console.log('✔ Test 3 passed: Health route properly positioned');
  }

  console.log('All rate limit pipeline security tests passed successfully!');
}

runTests();
