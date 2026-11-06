/**
 * @file userValidator.test.js
 * Unit tests for RFC 5322 email regex validation and user creation validator.
 */

import assert from 'assert';
import {
  EMAIL_REGEX,
  isValidEmail,
  validateCreateUser,
} from '../validators/user.js';

function runTests() {
  console.log('Running user validator unit tests...');

  // Test 1: Valid email formats
  {
    const validEmails = [
      'user@example.com',
      'john.doe@subdomain.company.org',
      'developer+bounty@github.io',
      'test_123.user@domain.co.uk',
      'admin@securebanana.io',
    ];

    for (const email of validEmails) {
      assert.strictEqual(isValidEmail(email), true, `Failed on valid email: ${email}`);
      const res = validateCreateUser({ email, name: 'John Doe' });
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.email, email.toLowerCase());
    }
    console.log('✔ Test 1 passed: Valid RFC 5322 emails accepted');
  }

  // Test 2: Invalid / malformed email formats (missing TLD, missing domain, missing @, spaces)
  {
    const invalidEmails = [
      'user@',
      'user@domain',
      '@domain.com',
      'plainaddress',
      'user@.com',
      'user @domain.com',
      'user@domain..com',
      '',
      null,
      undefined,
      12345,
    ];

    for (const email of invalidEmails) {
      assert.strictEqual(isValidEmail(email), false, `Failed: Should reject invalid email: ${email}`);
      const res = validateCreateUser({ email });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Valid email is required');
    }
    console.log('✔ Test 2 passed: Malformed emails rejected with strict error message');
  }

  // Test 3: Null, undefined, and non-object payloads
  {
    assert.deepStrictEqual(validateCreateUser(null), { valid: false, error: 'Valid email is required' });
    assert.deepStrictEqual(validateCreateUser(undefined), { valid: false, error: 'Valid email is required' });
    assert.deepStrictEqual(validateCreateUser('string_payload'), { valid: false, error: 'Valid email is required' });
    console.log('✔ Test 3 passed: Non-object payloads handled safely');
  }

  // Test 4: Role defaulting and sanitization
  {
    const res1 = validateCreateUser({ email: 'Test@Domain.COM', name: ' Alice ', role: 'freelancer' });
    assert.strictEqual(res1.valid, true);
    assert.strictEqual(res1.data.email, 'test@domain.com');
    assert.strictEqual(res1.data.name, 'Alice');
    assert.strictEqual(res1.data.role, 'freelancer');

    const res2 = validateCreateUser({ email: 'bob@example.com', role: 'invalid_role' });
    assert.strictEqual(res2.valid, true);
    assert.strictEqual(res2.data.role, 'client');
    console.log('✔ Test 4 passed: Role sanitization and email lowercasing');
  }

  console.log('All user validator tests passed successfully!');
}

runTests();
