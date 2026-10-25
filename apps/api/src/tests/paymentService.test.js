import { describe, it, expect } from 'vitest';
import { createPaymentIntent } from '../services/paymentService.js';

describe('paymentService', () => {
  it('should create payment intent with server-generated ID', async () => {
    const result = await createPaymentIntent({ amount: 5000 });
    expect(result.paymentId).toMatch(/^pay_\d+_\d+$/);
    expect(result.amount).toBe(5000);
    expect(result.currency).toBe('usd');
    expect(result.provider).toBe('stripe');
  });

  it('should default currency to usd', async () => {
    const result = await createPaymentIntent({ amount: 1000 });
    expect(result.currency).toBe('usd');
  });

  it('should allow overriding currency', async () => {
    const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });
    expect(result.currency).toBe('eur');
  });

  it('should not allow payload to override paymentId', async () => {
    const result = await createPaymentIntent({ paymentId: 'hacked_pay' });
    expect(result.paymentId).not.toBe('hacked_pay');
  });

  it('should generate unique IDs for same-millisecond creations', async () => {
    const results = await Promise.all([
      createPaymentIntent({ amount: 1 }),
      createPaymentIntent({ amount: 2 }),
      createPaymentIntent({ amount: 3 }),
    ]);
    const ids = results.map(r => r.paymentId);
    expect(new Set(ids).size).toBe(3);
  });
});
