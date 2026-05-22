import { test, mock } from 'node:test';
import assert from 'node:assert';
import { requireAdmin } from '../middleware/auth.js';

test('requireAdmin middleware', async (t) => {
  await t.test('calls next() if user is admin', (t) => {
    const req = { user: { role: 'admin' } };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireAdmin(req, res, next);
    assert.strictEqual(nextCalled, true);
  });

  await t.test('returns 403 if user is not admin', (t) => {
    const req = { user: { role: 'client' } };
    let statusCode;
    let responseBody;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      }
    };
    const next = mock.fn();

    requireAdmin(req, res, next);
    
    assert.strictEqual(next.mock.calls.length, 0);
    assert.strictEqual(statusCode, 403);
    assert.deepStrictEqual(responseBody, {
      success: false,
      message: "Forbidden: Admin access required"
    });
  });

  await t.test('returns 403 if user is undefined', (t) => {
    const req = {};
    let statusCode;
    let responseBody;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      }
    };
    const next = mock.fn();

    requireAdmin(req, res, next);
    
    assert.strictEqual(next.mock.calls.length, 0);
    assert.strictEqual(statusCode, 403);
    assert.deepStrictEqual(responseBody, {
      success: false,
      message: "Forbidden: Admin access required"
    });
  });
});
