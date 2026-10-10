import assert from 'assert';
import { registerSchema } from '../validators/auth.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

async function runTests() {
  console.log('Running admin security unit tests...');

  // Test 1: Registration rejects admin role
  {
    let threw = false;
    try { registerSchema.parse({ email: 'attacker@evil.com', password: 'StrongP@ss1!', role: 'admin' }); } catch { threw = true; }
    assert.strictEqual(threw, true);
    console.log('✔ Test 1 passed: Registration rejects admin role');
  }

  // Test 2: Registration accepts client role
  {
    const result = registerSchema.parse({ email: 'user@example.com', password: 'StrongP@ss1!', role: 'client' });
    assert.strictEqual(result.role, 'client');
    console.log('✔ Test 2 passed: Registration accepts client role');
  }

  // Test 3: Registration accepts freelancer role
  {
    const result = registerSchema.parse({ email: 'dev@example.com', password: 'StrongP@ss1!', role: 'freelancer' });
    assert.strictEqual(result.role, 'freelancer');
    console.log('✔ Test 3 passed: Registration accepts freelancer role');
  }

  // Test 4: Default role is client when omitted
  {
    const result = registerSchema.parse({ email: 'default@example.com', password: 'StrongP@ss1!' });
    assert.strictEqual(result.role, 'client');
    console.log('✔ Test 4 passed: Default role is client');
  }

  // Test 5: requireAdmin blocks non-admin
  {
    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = { status: (code) => { statusCalled = code; return { json: (d) => { jsonResult = d; return d; } }; } };
    requireAdmin({ user: { sub: 'usr_1', role: 'client' } }, mockRes, () => {});
    assert.strictEqual(statusCalled, 403);
    console.log('✔ Test 5 passed: Non-admin user blocked with 403');
  }

  // Test 6: requireAdmin allows admin
  {
    let nextCalled = false;
    requireAdmin({ user: { sub: 'usr_admin', role: 'admin' } }, {}, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    console.log('✔ Test 6 passed: Admin user allowed through');
  }

  console.log('All admin security tests passed successfully!');
}

runTests();
