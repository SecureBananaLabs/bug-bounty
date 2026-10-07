import request from 'supertest';
import { app } from '../../src/app';
import { AuthController } from '../../src/controllers/authController';

describe('Auth Routes - Rate Limiting', () => {
  let originalLoginAttempts: Map<string, number>;

  beforeEach(() => {
    originalLoginAttempts = new Map();
  });

  describe('POST /api/auth/login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should allow up to 5 login attempts within 15 minutes', async () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send(validCredentials);
        results.push(res.status);
      }
      // All 5 should be processed (either success or auth failure, but not 429)
      results.forEach((status, idx) => {
        expect(status).not.toBe(429);
      });
    });

    it('should return 429 on the 6th login attempt', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(validCredentials);
      }
      const res = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);
      expect(res.status).toBe(429);
    });

    it('should return 429 on repeated login attempts with different credentials', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: `user${i}@example.com`,
            password: 'wrongpassword',
          });
      }
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'hacker@example.com',
          password: 'hackme',
        });
      expect(res.status).toBe(429);
    });
  });

  describe('Unrelated endpoints remain available', () => {
    it('should still allow general API requests (200 per 15 min)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('should allow registration even when login is rate limited', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password123' });
      }
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'newpassword123',
          name: 'New User',
        });
      expect(res.status).not.toBe(429);
    });
  });
});
