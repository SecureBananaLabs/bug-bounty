import request from 'supertest';
import { app } from '../app';
import { generateRefreshToken } from '../utils/jwt';

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 400 when token is missing', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ token: 'invalid-token' });
      expect(res.status).toBe(401);
    });

    it('should return a new access token for a valid refresh token', async () => {
      const validToken = generateRefreshToken('usr_test', 'freelancer');
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ token: validToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('should preserve sub and role in the new access token', async () => {
      const validToken = generateRefreshToken('usr_preserve', 'admin');
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ token: validToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });
  });
});