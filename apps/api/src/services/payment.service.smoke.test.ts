import { describe, it, expect } from 'vitest';
import { createPaymentIntent } from './payment.service';

const RUN_SMOKE = process.env.RUN_STRIPE_SMOKE === '1';

describe.skipIf(!RUN_SMOKE)('Stripe PaymentIntent smoke test', () => {
  it('should create a real test-mode PaymentIntent', async () => {
    const result = await createPaymentIntent({
      amount: 2000,
      currency: 'usd',
    });

    expect(result.paymentId).toMatch(/^pi_/);
    expect(result.clientSecret).toMatch(/^pi_.*_secret_/);
    expect(result.amount).toBe(2000);
    expect(result.currency).toBe('usd');
    expect(result.provider).toBe('stripe');
  });

  it('should create a PaymentIntent with metadata', async () => {
    const result = await createPaymentIntent({
      amount: 500,
      currency: 'eur',
      metadata: { orderId: '12345' },
    });

    expect(result.paymentId).toMatch(/^pi_/);
    expect(result.clientSecret).toMatch(/^pi_.*_secret_/);
    expect(result.amount).toBe(500);
    expect(result.currency).toBe('eur');
    expect(result.provider).toBe('stripe');
  });
});