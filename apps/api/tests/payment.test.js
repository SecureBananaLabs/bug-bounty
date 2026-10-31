import request from 'supertest';
import { createApp } from '../src/app.js';
import { authMiddleware } from '../src/middleware/auth.js';
import { createPayment } from '../src/controllers/paymentController.js';

describe('Payment Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('should require authentication for /api/payments', async () => {
    const res = await request(app).post('/api/payments').send({ amount: 100 });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  it('should allow authenticated users to create payment', async () => {
    // 需要mock认证中间件和支付逻辑
    // 这里假设已正确实现认证和支付服务
    const res = await request(app).post('/api/payments').send({ amount: 100 }).set('Authorization', 'Bearer valid_token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('paymentIntent');
  });
});