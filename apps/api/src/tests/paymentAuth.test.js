import { describe, it, expect } from 'vitest';
import { createPaymentSchema } from '../validators/payment.js';
import { createApp } from '../app.js';

describe('paymentRoutes: auth + validation', () => {
  it('should return 401 without auth token', async () => {
    const app = createApp();
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, currency: 'usd' }),
    });

    expect(res.status).toBe(401);
    await new Promise((r) => server.close(() => r()));
  });

  it('should reject negative amounts with 400', async () => {
    const result = createPaymentSchema.safeParse({ amount: -500 });
    expect(result.success).toBe(false);
  });

  it('should reject non-finite amounts', async () => {
    const result = createPaymentSchema.safeParse({ amount: Infinity });
    expect(result.success).toBe(false);
  });

  it('should accept valid positive amount with default currency', async () => {
    const result = createPaymentSchema.safeParse({ amount: 1999 });
    expect(result.success).toBe(true);
    expect(result.data.currency).toBe('usd');
  });

  it('should accept valid custom 3-letter currency', async () => {
    const result = createPaymentSchema.safeParse({ amount: 500, currency: 'eur' });
    expect(result.success).toBe(true);
    expect(result.data.currency).toBe('eur');
  });
});
