/**
 * @file passwordComplexity.test.js
 * Unit tests for passwordComplexitySchema and validatePasswordComplexity helper.
 */

import assert from 'assert';
import { passwordComplexitySchema, validatePasswordComplexity, registerSchema } from '../validators/auth.js';

function runTests() {
  console.log('Running password complexity unit tests...');

  // Test 1: Strong password passes validation
  {
    const valid = 'Secret@123';
    const parsed = passwordComplexitySchema.safeParse(valid);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.data, valid);

    const helper = validatePasswordComplexity(valid);
    assert.strictEqual(helper.success, true);
    console.log('✔ Test 1 passed: Strong password passes validation');
  }

  // Test 2: Fails when shorter than 8 characters
  {
    const shortPass = 'Ab1@';
    const parsed = passwordComplexitySchema.safeParse(shortPass);
    assert.strictEqual(parsed.success, false);
    assert.strictEqual(
      parsed.error.errors.some((e) => e.message.includes('8 characters')),
      true
    );
    console.log('✔ Test 2 passed: Length constraint enforced');
  }

  // Test 3: Fails when missing uppercase letter
  {
    const noUpper = 'secret@123';
    const parsed = passwordComplexitySchema.safeParse(noUpper);
    assert.strictEqual(parsed.success, false);
    assert.strictEqual(
      parsed.error.errors.some((e) => e.message.includes('uppercase')),
      true
    );
    console.log('✔ Test 3 passed: Uppercase requirement enforced');
  }

  // Test 4: Fails when missing digit
  {
    const noDigit = 'Secret@Password';
    const parsed = passwordComplexitySchema.safeParse(noDigit);
    assert.strictEqual(parsed.success, false);
    assert.strictEqual(
      parsed.error.errors.some((e) => e.message.includes('digit')),
      true
    );
    console.log('✔ Test 4 passed: Digit requirement enforced');
  }

  // Test 5: Fails when missing special character
  {
    const noSpecial = 'Secret12345';
    const parsed = passwordComplexitySchema.safeParse(noSpecial);
    assert.strictEqual(parsed.success, false);
    assert.strictEqual(
      parsed.error.errors.some((e) => e.message.includes('special character')),
      true
    );
    console.log('✔ Test 5 passed: Special character requirement enforced');
  }

  // Test 6: Integrated registerSchema validation
  {
    const validRegister = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'Secure#Password9',
    });
    assert.strictEqual(validRegister.success, true);

    const invalidRegister = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'weakpassword',
    });
    assert.strictEqual(invalidRegister.success, false);
    console.log('✔ Test 6 passed: Integrated registerSchema enforcement');
  }

  console.log('All password complexity tests passed successfully!');
}

runTests();
