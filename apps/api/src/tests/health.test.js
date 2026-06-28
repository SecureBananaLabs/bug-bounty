const request  = require('supertest');
const app      = require('../app');

// ─────────────────────────────────────────────────────────────────────────────
// Bug 1 regression: admin role must not be self-assignable at registration
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register — role validation', () => {

  test('rejects registration with role: admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name:     'Attacker',
        email:    'attacker@example.com',
        password: 'password123',
        role:     'admin',
      });

    expect(res.status).toBe(400);
    // Must not create an admin account
    expect(res.body.message).toMatch(/role/i);
  });

  test('accepts registration with role: client', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name:     'Client User',
        email:    'client@example.com',
        password: 'password123',
        role:     'client',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('client');
  });

  test('accepts registration with role: freelancer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name:     'Freelancer User',
        email:    'freelancer@example.com',
        password: 'password123',
        role:     'freelancer',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('freelancer');
  });

  test('defaults to client role when role is omitted', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name:     'Default User',
        email:    'default@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('client');
  });

  test('registered user is never given admin role regardless of payload', async () => {
    const attempts = ['admin', 'ADMIN', 'Admin', ' admin '];
    for (const role of attempts) {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'X', email: `x+${role}@example.com`, password: 'pass123', role });
      expect(res.status).toBe(400);
    }
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// Bug 2 regression: refresh controller must pass token to the service
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh — token forwarding', () => {

  test('returns 400 when token is missing from body', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/token/i);
  });

  test('returns 400 when token is empty string', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: '' });

    expect(res.status).toBe(400);
  });

  test('returns 401 for an invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: 'not-a-real-token' });

    // Should fail with auth error, NOT a 500 from undefined being passed
    expect([400, 401, 403]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  test('returns new access token for a valid refresh token', async () => {
    // First register + login to get a real refresh token
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Refresh Test', email: 'refresh@example.com', password: 'pass123' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@example.com', password: 'pass123' });

    const { refreshToken } = loginRes.body;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ token: refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty('accessToken');
  });
});
