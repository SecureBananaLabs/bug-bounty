import request from 'supertest';
import { createApp } from '../../src/app.js';
import { authMiddleware } from '../../src/middleware/auth.js';

describe('User routes authentication', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('should require authentication for POST /api/users', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'test', password: 'pass' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  it('should allow authenticated users to create account', async () => {
    // 假设已实现 JWT 认证模拟
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer valid_token')
      .send({ username: 'test', password: 'pass' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
  });
});