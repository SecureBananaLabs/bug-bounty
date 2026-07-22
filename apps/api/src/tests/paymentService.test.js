import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

// Mock Stripe before importing the service
const mockPaymentIntentsCreate = mock.fn();
mock.module('stripe', {
  default: function() {
    return { paymentIntents: { create: mockPaymentIntentsCreate } };
  }
});

const { createPaymentIntent } = await import('../services/paymentService.js');

describe('createPaymentIntent', () => {
  it('throws error when amount is missing', async () => {
    await assert.rejects(
      () => createPaymentIntent({}),
      /payload\.amount is required/
    );
  });

  it('throws error when amount is not a positive integer', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: -100 }),
      /payload\.amount is required and must be a positive integer/
    );
  });

  it('throws error when amount is not an integer', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 10.5 }),
      /payload\.amount is required and must be a positive integer/
    );
  });

  it('creates a payment intent with correct parameters', async () => {
    const mockResult = {
      id: 'pi_test123',
      client_secret: 'secret_test123',
      amount: 1000,
      currency: 'usd',
    };
    mockPaymentIntentsCreate.mock.mockImplementation(() => Promise.resolve(mockResult));

    const result = await createPaymentIntent({ amount: 1000 });

    assert.strictEqual(result.paymentId, 'pi_test123');
    assert.strictEqual(result.clientSecret, 'secret_test123');
    assert.strictEqual(result.amount, 1000);
    assert.strictEqual(result.currency, 'usd');
    assert.strictEqual(result.provider, 'stripe');
  });

  it('defaults currency to usd', async () => {
    const mockResult = {
      id: 'pi_test456',
      client_secret: 'secret_test456',
      amount: 500,
      currency: 'usd',
    };
    mockPaymentIntentsCreate.mock.mockImplementation(() => Promise.resolve(mockResult));

    const result = await createPaymentIntent({ amount: 500 });

    assert.strictEqual(result.currency, 'usd');
  });

  it('uses provided currency', async () => {
    const mockResult = {
      id: 'pi_test789',
      client_secret: 'secret_test789',
      amount: 750,
      currency: 'eur',
    };
    mockPaymentIntentsCreate.mock.mockImplementation(() => Promise.resolve(mockResult));

    const result = await createPaymentIntent({ amount: 750, currency: 'eur' });

    assert.strictEqual(result.currency, 'eur');
  });

  it('throws Stripe errors with message preserved', async () => {
    const stripeError = new Error('Your card was declined');
    stripeError.type = 'StripeCardError';
    mockPaymentIntentsCreate.mock.mockImplementation(() => Promise.reject(stripeError));

    await assert.rejects(
      () => createPaymentIntent({ amount: 1000 }),
      /Stripe error: Your card was declined/
    );
  });
});
