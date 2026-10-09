import request from 'supertest';
import { createApp } from '../src/index';
import { router } from '../src/routes';

describe('API Routes', () => {
  const app = createApp();

  describe('health check', () => {
    it('returns 200 with JSON envelope for GET /api/health', async () => {
      const res = await request(app).get('/api/health').expect(200);
      expect(res.body).toEqual({ success: true, message: 'OK' });
    });
  });

  describe('users', () => {
    it('returns 200 with JSON envelope for GET /api/users', async () => {
      const res = await request(app).get('/api/users').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('unknown routes', () => {
    it('returns 404 with JSON envelope for unmatched routes', async () => {
      const res = await request(app).get('/api/does-not-exist').expect(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Not found',
      });
    });

    it('returns 404 with JSON envelope for unmatched routes outside /api', async () => {
      const res = await request(app).get('/unknown').expect(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Not found',
      });
    });
  });
});
