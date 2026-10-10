/**
 * @file userAuth.test.js
 * Unit tests verifying that GET /api/users requires authentication.
 */

import assert from 'assert';
import { authMiddleware } from '../middleware/auth.js';
import { getUsers } from '../controllers/userController.js';
import { signAccessToken } from '../utils/jwt.js';

async function runTests() {
  console.log('Running user authentication route unit tests...');

  // Test 1: Unauthenticated request rejected (401 Unauthorized)
  {
    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (d) => {
            jsonResult = d;
            return d;
          },
        };
      },
    };

    let nextCalled = false;
    authMiddleware({ headers: {} }, mockRes, () => { nextCalled = true; });

    assert.strictEqual(statusCalled, 401);
    assert.strictEqual(jsonResult.success, false);
    assert.strictEqual(jsonResult.message, 'Unauthorized');
    assert.strictEqual(nextCalled, false);
    console.log('✔ Test 1 passed: Unauthenticated request rejected with HTTP 401 Unauthorized');
  }

  // Test 2: Invalid Bearer token rejected (401)
  {
    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (d) => {
            jsonResult = d;
            return d;
          },
        };
      },
    };

    let nextCalled = false;
    authMiddleware({ headers: { authorization: 'Bearer invalid_token_xyz' } }, mockRes, () => { nextCalled = true; });

    assert.strictEqual(statusCalled, 401);
    assert.strictEqual(jsonResult.success, false);
    assert.strictEqual(jsonResult.message, 'Invalid token');
    assert.strictEqual(nextCalled, false);
    console.log('✔ Test 2 passed: Invalid token rejected with HTTP 401');
  }

  // Test 3: Valid Bearer token authenticated and allows access to getUsers (200 OK)
  {
    const token = signAccessToken({ sub: 'usr_verified_123', role: 'client' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    let nextCalled = false;

    authMiddleware(req, {}, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.sub, 'usr_verified_123');

    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (d) => {
            jsonResult = d;
            return d;
          },
        };
      },
    };

    await getUsers(req, mockRes);
    assert.strictEqual(statusCalled, 200);
    assert.strictEqual(jsonResult.success, true);
    assert.ok(Array.isArray(jsonResult.data));
    console.log('✔ Test 3 passed: Valid authentication grants access with HTTP 200');
  }

  console.log('All user authentication route tests passed successfully!');
}

runTests();
