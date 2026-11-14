import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createPayment } from '../../src/controllers/paymentController.js';
import { authMiddleware } from '../../src/middleware/auth.js';

describe('Payment Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('should require authentication for /api/payments', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 100 });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  it('should allow authenticated users to create payment', async () => {
    // 模拟认证信息
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer valid_token')
      .send({ amount: 100 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('paymentIntent');
  });
});