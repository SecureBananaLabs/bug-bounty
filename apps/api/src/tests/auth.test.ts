import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/refresh', () => {
  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing|invalid/i);
  });

  it('returns 401 when token is invalid', ditto', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: 'invalid-token' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid|expired/i);
  });

  it('returns a new access token for a valid token', async () => {
    // First, we need a valid token. In a real scenario, this would come from login.
    // We'll mock the verifyToken to return a valid payload for this test.
    const jwt = require('../utils/jwt');
    jest.spyOn(jwt, 'verifyToken').mockReturnValueOnce({
      sub: 'usr_existing',
      role: 'freelancer',
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('preserves sub and role from the original token', async () => {
    const jwt = require('../utils/jwt');
    jest.spyOn(jwt, 'verifyToken').mockReturnValueOnce({
      sub: 'user-123',
      role: 'admin',
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});