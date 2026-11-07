import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock Stripe before importing paymentService
const mockCreate = mock.fn();
const mockStripe = { paymentIntents: { create: mockCreate } };
mock.module('stripe', { namedExports: { default: mockStripe } });

// Import after mocking
const { createPaymentIntent } = await import('../services/paymentService.js');

describe('createPaymentIntent', () => {
  beforeEach(() => {
    mockCreate.mock.resetCalls();
  });

  it('throws when amount is missing', async () => {
    await assert.rejects(
      () => createPaymentIntent({}),
      /amount is required and must be a positive integer/
    );
  });

  it('throws when amount is not a number', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 'abc' }),
      /amount is required and must be a positive integer/
    );
  });

  it('throws when amount is zero', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 0 }),
      /amount is required and must be a positive integer/
    );
  });

  it('throws when amount is negative', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: -100 }),
      /amount is required and must be a positive integer/
    );
  });

  it('throws when amount is a float', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 10.5 }),
      /amount is required and must be a positive integer/
    );
  });

  it('uses default currency of usd when not provided', async () => {
    mockCreate.mock.mockImplementationOnce(async () => ({
      id: 'pi_test123',
      client_secret: 'pi_test123_secret_xyz',
      amount: 1000,
      currency: 'usd'
    }));

    await createPaymentIntent({ amount: 1000 });

    const call = mockCreate.mock.calls[0];
    assert.strictEqual(call.arguments[0].currency, 'usd');
  });

  it('returns clientSecret and paymentId when successful', async () => {
    mockCreate.mock.mockImplementationOnce(async () => ({
      id: 'pi_test123',
      client_secret: 'pi_test123_secret_xyz',
      amount: 1000,
      currency: 'usd'
    }));

    const result = await createPaymentIntent({ amount: 1000 });

    assert.strictEqual(result.paymentId, 'pi_test123');
    assert.strictEqual(result.clientSecret, 'pi_test123_secret_xyz');
    assert.strictEqual(result.amount, 1000);
    assert.strictEqual(result.currency, 'usd');
    assert.strictEqual(result.provider, 'stripe');
  });

  it('accepts valid currency', async () => {
    mockCreate.mock.mockImplementationOnce(async () => ({
      id: 'pi_test456',
      client_secret: 'pi_test456_secret_abc',
      amount: 2000,
      currency: 'eur'
    }));

    const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });

    const call = mockCreate.mock.calls[0];
    assert.strictEqual(call.arguments[0].currency, 'eur');
    assert.strictEqual(result.currency, 'eur');
  });
});