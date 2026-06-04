const request = require('supertest');
const app = require('../src/app');

describe('POST /api/payments', () => {
  it('should create a payment intent with valid amount and default currency', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 100 })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.amount).toBe(100);
    expect(res.body.currency).toBe('usd');
  });

  it('should create a payment intent with valid amount and specified currency', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 50, currency: 'eur' })
      .expect(201);

    expect(res.body.currency).toBe('eur');
  });

  it('should reject missing amount', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({})
      .expect(400);

    expect(res.body.error).toBe('amount is required');
  });

  it('should reject zero amount', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 0 })
      .expect(400);

    expect(res.body.error).toBe('amount must be a positive number');
  });

  it('should reject negative amount', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: -10 })
      .expect(400);

    expect(res.body.error).toBe('amount must be a positive number');
  });

  it('should reject non-numeric amount', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 'abc' })
      .expect(400);

    expect(res.body.error).toBe('amount must be a number');
  });

  it('should reject unsupported currency', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 100, currency: 'xyz' })
      .expect(400);

    expect(res.body.error).toContain('unsupported currency');
  });

  it('should handle uppercase currency gracefully', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 100, currency: 'USD' })
      .expect(201);

    expect(res.body.currency).toBe('usd');
  });
});
