import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateCreateUser } from '../validators/user.js';

describe('User Creation Validation', () => {
  it('should reject requests without a valid email', () => {
    const res1 = validateCreateUser({});
    assert.strictEqual(res1.valid, false);
    assert.strictEqual(res1.error, 'Valid email is required');

    const res2 = validateCreateUser({ email: 'invalid-email' });
    assert.strictEqual(res2.valid, false);
    assert.strictEqual(res2.error, 'Valid email is required');
  });

  it('should reject admin role assignment', () => {
    const res = validateCreateUser({ email: 'test@example.com', role: 'admin' });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, 'Admin role assignment not permitted');
  });

  it('should allow valid freelancer or client roles', () => {
    const res1 = validateCreateUser({ email: 'test1@example.com', role: 'freelancer' });
    assert.strictEqual(res1.valid, true);
    assert.strictEqual(res1.data.role, 'freelancer');

    const res2 = validateCreateUser({ email: 'test2@example.com', role: 'client' });
    assert.strictEqual(res2.valid, true);
    assert.strictEqual(res2.data.role, 'client');
  });

  it('should default to client role if role is omitted', () => {
    const res = validateCreateUser({ email: 'test3@example.com' });
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.data.role, 'client');
  });
});

