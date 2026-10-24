/**
 * @file searchAuth.test.js
 * Unit tests verifying that GET /api/search requires authentication and validates search query.
 */

import assert from 'assert';
import { authMiddleware } from '../middleware/auth.js';
import { search } from '../controllers/searchController.js';
import { signAccessToken } from '../utils/jwt.js';

async function runTests() {
  console.log('Running search authentication route unit tests...');

  // Test 1: Unauthenticated search request rejected (401 Unauthorized)
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
    console.log('✔ Test 1 passed: Unauthenticated search request rejected with HTTP 401 Unauthorized');
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
    authMiddleware({ headers: { authorization: 'Bearer malformed_or_expired_token' } }, mockRes, () => { nextCalled = true; });

    assert.strictEqual(statusCalled, 401);
    assert.strictEqual(jsonResult.success, false);
    assert.strictEqual(jsonResult.message, 'Invalid token');
    assert.strictEqual(nextCalled, false);
    console.log('✔ Test 2 passed: Malformed token rejected with HTTP 401');
  }

  // Test 3: Authenticated user with valid query can search (200 OK)
  {
    const token = signAccessToken({ sub: 'usr_verified_client', role: 'client' });
    const req = {
      headers: { authorization: `Bearer ${token}` },
      query: { q: 'frontend engineer' },
    };
    let nextCalled = false;

    authMiddleware(req, {}, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.sub, 'usr_verified_client');

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

    await search(req, mockRes);
    assert.strictEqual(statusCalled, 200);
    assert.strictEqual(jsonResult.success, true);
    assert.strictEqual(jsonResult.data.query, 'frontend engineer');
    console.log('✔ Test 3 passed: Authenticated search executed with HTTP 200 OK');
  }

  console.log('All search authentication route tests passed successfully!');
}

runTests();
