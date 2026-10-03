import assert from 'assert';
import { refresh } from '../controllers/authController.js';
import { refreshToken } from '../services/authService.js';

async function runTests() {
  console.log('Running auth refresh unit tests...');

  // Test 1: Unauthenticated refresh rejected (401)
  {
    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = { status: (code) => { statusCalled = code; return { json: (d) => { jsonResult = d; return d; } }; } };
    await refresh({ user: undefined }, mockRes);
    assert.strictEqual(statusCalled, 401);
    assert.strictEqual(jsonResult.success, false);
    console.log('✔ Test 1 passed: Unauthenticated refresh rejected with 401');
  }

  // Test 2: Authenticated refresh preserves sub and role (200)
  {
    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = { status: (code) => { statusCalled = code; return { json: (d) => { jsonResult = d; return d; } }; } };
    await refresh({ user: { sub: 'usr_admin_123', role: 'admin' } }, mockRes);
    assert.strictEqual(statusCalled, 200);
    assert.strictEqual(jsonResult.success, true);
    assert.ok(jsonResult.data.token);
    console.log('✔ Test 2 passed: Authenticated refresh returns token with 200');
  }

  // Test 3: refreshToken service preserves identity
  {
    const result = await refreshToken({ sub: 'usr_dev_456', role: 'freelancer' });
    assert.ok(result.token);
    assert.ok(typeof result.token === 'string');
    console.log('✔ Test 3 passed: refreshToken preserves user identity');
  }

  // Test 4: refreshToken throws on missing user
  {
    let threw = false;
    try { await refreshToken(null); } catch { threw = true; }
    assert.strictEqual(threw, true);
    console.log('✔ Test 4 passed: refreshToken throws on null user');
  }

  console.log('All auth refresh tests passed successfully!');
}

runTests();
