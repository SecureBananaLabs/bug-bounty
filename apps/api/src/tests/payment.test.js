import { test, describe, mock } from 'node:test';
import assert from 'node:assert';

// Set dummy key before importing anything that uses Stripe
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';

import { createPaymentIntent, stripe } from '../services/paymentService.js';

// Mock the Stripe instance methods directly on the exported instance
const mockCreate = mock.fn(async (params) => {
  if (params.amount === 999999) {
    throw new Error('Stripe card declined');
  }
  return {
    id: 'pi_mock_123',
    client_secret: 'secret_mock_123'
  };
});

// Mock the method on the stripe instance
mock.method(stripe.paymentIntents, 'create', mockCreate);

describe('Payment Service Unit Tests', () => {
  test('successfully creates a payment intent', async () => {
    const payload = { amount: 5000, currency: 'eur' };
    const result = await createPaymentIntent(payload);

    assert.strictEqual(result.paymentId, 'pi_mock_123');
    assert.strictEqual(result.clientSecret, 'secret_mock_123');
    
    const lastCall = mockCreate.mock.calls[mockCreate.mock.calls.length - 1];
    assert.deepStrictEqual(lastCall.arguments[0], { amount: 5000, currency: 'eur' });
  });

  test('uses usd as default currency', async () => {
    const payload = { amount: 1000 };
    await createPaymentIntent(payload);
    
    const lastCall = mockCreate.mock.calls[mockCreate.mock.calls.length - 1];
    assert.strictEqual(lastCall.arguments[0].currency, 'usd');
  });

  test('throws error if amount is missing', async () => {
    await assert.rejects(
      createPaymentIntent({ currency: 'usd' }),
      { message: 'payload.amount is required and must be a positive integer (cents)' }
    );
  });

  test('throws error if amount is not an integer', async () => {
    await assert.rejects(
      createPaymentIntent({ amount: 10.5 }),
      { message: 'payload.amount is required and must be a positive integer (cents)' }
    );
  });

  test('throws error if amount is negative', async () => {
    await assert.rejects(
      createPaymentIntent({ amount: -100 }),
      { message: 'payload.amount is required and must be a positive integer (cents)' }
    );
  });

  test('preserves original Stripe error messages', async () => {
    await assert.rejects(
      createPaymentIntent({ amount: 999999 }),
      { message: 'Stripe card declined' }
    );
  });
});
