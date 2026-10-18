import assert from 'assert';
import { loginSchema } from '../validators/auth.js';
import { login } from '../controllers/authController.js';

async function runTests() {
  console.log('Running login hardening unit tests...');

  // Test 1: Empty password rejected
  {
    let threw = false;
    try { loginSchema.parse({ email: 'user@example.com', password: '' }); } catch { threw = true; }
    assert.strictEqual(threw, true);
    console.log('✔ Test 1 passed: Empty password rejected by schema');
  }

  // Test 2: Short password (< 8 chars) rejected
  {
    let threw = false;
    try { loginSchema.parse({ email: 'user@example.com', password: 'short' }); } catch { threw = true; }
    assert.strictEqual(threw, true);
    console.log('✔ Test 2 passed: Short password rejected by schema');
  }

  // Test 3: Valid password accepted
  {
    const result = loginSchema.parse({ email: 'user@example.com', password: 'ValidPass123' });
    assert.strictEqual(result.email, 'user@example.com');
    assert.strictEqual(result.password, 'ValidPass123');
    console.log('✔ Test 3 passed: Valid password accepted');
  }

  // Test 4: Invalid email rejected
  {
    let threw = false;
    try { loginSchema.parse({ email: 'not-an-email', password: 'ValidPass123' }); } catch { threw = true; }
    assert.strictEqual(threw, true);
    console.log('✔ Test 4 passed: Invalid email rejected');
  }

  console.log('All login hardening tests passed successfully!');
}

runTests();
