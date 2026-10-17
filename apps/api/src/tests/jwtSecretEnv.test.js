/**
 * @file jwtSecretEnv.test.js
 * Unit tests for getJwtSecret and environment security validation.
 */

import assert from 'assert';
import { getJwtSecret } from '../config/env.js';

function runTests() {
  console.log('Running JWT_SECRET environment security unit tests...');

  // Test 1: Development mode uses fallback default secret
  {
    const secret = getJwtSecret('development', undefined);
    assert.strictEqual(secret, 'development-secret');

    const emptySecret = getJwtSecret('development', '');
    assert.strictEqual(emptySecret, 'development-secret');
    console.log('✔ Test 1 passed: Development mode fallback default secret');
  }

  // Test 2: Custom secret used when provided in development
  {
    const custom = 'my-custom-dev-secret';
    const secret = getJwtSecret('development', custom);
    assert.strictEqual(secret, custom);
    console.log('✔ Test 2 passed: Custom secret in development');
  }

  // Test 3: Production mode with valid secret succeeds
  {
    const prodSecret = 'prod_ultra_secure_secret_2026';
    const secret = getJwtSecret('production', prodSecret);
    assert.strictEqual(secret, prodSecret);
    console.log('✔ Test 3 passed: Production mode with explicit secret');
  }

  // Test 4: Production mode throws when secret is missing or empty
  {
    assert.throws(
      () => getJwtSecret('production', undefined),
      /JWT_SECRET environment variable is required/
    );
    assert.throws(
      () => getJwtSecret('production', ''),
      /JWT_SECRET environment variable is required/
    );
    assert.throws(
      () => getJwtSecret('production', '   '),
      /JWT_SECRET environment variable is required/
    );
    console.log('✔ Test 4 passed: Production mode throws on missing secret');
  }

  // Test 5: Production mode rejects default fallback secret
  {
    assert.throws(
      () => getJwtSecret('production', 'development-secret'),
      /JWT_SECRET environment variable is required and must be secure/
    );
    console.log('✔ Test 5 passed: Production mode rejects development-secret value');
  }

  console.log('All JWT_SECRET environment tests passed successfully!');
}

runTests();
