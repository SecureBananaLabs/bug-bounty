import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/refresh', () => {
  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Token is required');
  });

  it('returns 400 when token is empty string', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Token is required');
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: 'invalid-token' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('returns 401 when token has invalid payload', async () => {
    const jwt = require('jsonwebtoken');
    const badToken = jwt.sign({ foo: 'bar' }, 'dev-refresh-secret');

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: badToken });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token payload');
  });

  it('returns new access token for valid refresh token', async () => {
    const jwt = require('jsonwebtoken');
    const validToken = jwt.sign({ sub: 'usr_existing', role: 'freelancer' }, 'dev-refresh-secret');

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: validToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');
  });
});