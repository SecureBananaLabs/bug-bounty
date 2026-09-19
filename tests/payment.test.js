const request = require('supertest');
const app = require('../../apps/api/src/app.js');
const { createApp } = require('../../apps/api/src/app');
const { verifyAccessToken } = require('../../apps/api/src/utils/jwt');

describe('Payment Routes', () => {
  let server;

  beforeEach(() => {
    server = createApp();
    server.listen();
  });

  afterEach(() => {
    server.close();
  });

  it('should require authentication for payment creation', async () => {
    const response = await request(server).post('/api/payments').send({ amount: 100 });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  it('should allow authenticated users to create payments', async () => {
    const mockUser = { id: '123' };
    const mockToken = 'mock.jwt.token';
    
    // 模拟认证中间件通过
    const response = await request(server)
      .post('/api/payments')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ amount: 100 });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('paymentIntent');
  });
});