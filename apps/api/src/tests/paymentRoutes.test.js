const request = require('supertest');
const app = require('../app');

describe('POST /api/payments/intents – currency normalization', () => {
  const basePayload = { amount: 5000 };

  it('defaults currency to "usd" when currency is missing', async () => {
    const res = await request(app)
      .post('/api/payments/intents')
      .send(basePayload)
      .expect(200);

    expect(res.body.currency).toBe('usd');
  });

  it('trims and lowercases a mixed-case / whitespace-padded currency string', async () => {
    const res = await request(app)
      .post('/api/payments/intents')
      .send({ ...basePayload, currency: '  USD  ' })
      .expect(200);

    expect(res.body.currency).toBe('usd');
  });

  it('falls back to "usd" when currency is a blank string', async () => {
    const res = await request(app)
      .post('/api/payments/intents')
      .send({ ...basePayload, currency: '   ' })
      .expect(200);

    expect(res.body.currency).toBe('usd');
  });

  it('falls back to "usd" when currency is a non-string value', async () => {
    const res = await request(app)
      .post('/api/payments/intents')
      .send({ ...basePayload, currency: 840 })
      .expect(200);

    expect(res.body.currency).toBe('usd');
  });

  it('preserves an already-valid lowercase currency', async () => {
    const res = await request(app)
      .post('/api/payments/intents')
      .send({ ...basePayload, currency: 'eur' })
      .expect(200);

    expect(res.body.currency).toBe('eur');
  });
});
