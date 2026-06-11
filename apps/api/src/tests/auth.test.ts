import request from 'supertest';
import { app } from '../app';
import { signRefreshToken } from '../utils/jwt';

describe('POST /api/auth/register', () => {
  it('registers a new user', async () => {
    expect(res.body).toHaveProperty('refreshToken');
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: 'invalid-token' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired refresh token');
  });

  it('returns new tokens for a valid refresh token', async () => {
    const token = signRefreshToken({ sub: 'usr_existing', role: 'client' });
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('preserves sub and role in the new access token', async () => {
    const token = signRefreshToken({ sub: 'custom_user', role: 'freelancer' });
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    // The access token is a JWT; we verify it contains the right sub/role by decoding
    const payload = JSON.parse(Buffer.from(res.body.accessToken.split('.')[1], 'base64').toString());
    expect(payload.sub).toBe('custom_user');
    expect(payload.role).toBe('freelancer');
  });
});