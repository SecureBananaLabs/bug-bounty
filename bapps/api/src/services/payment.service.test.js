import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Stripe module before importing the service
const mockPaymentIntentsCreate = vi.fn();

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: mockPaymentIntentsCreate,
      },
    })),
  };
});

import { createPaymentIntent } from './payment.service.js';

describe('createPaymentIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should create a payment intent with correct arguments', async () => {
    const mockPaymentIntent = {
      id: 'pi_1234567890',
      amount: 1000,
      currency: 'usd',
      client_secret: 'pi_1234567890_secret_abcdef',
    };

    mockPaymentIntentsCreate.mockResolvedValue(mockPaymentIntent);

    const payload = {
      amount: 1000,
      currency: 'usd',
    };

    const result = await createPaymentIntent(payload);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'usd',
      metadata: {},
    });

    expect(result).toEqual({
      paymentId: 'pi_1234567890',
      amount: 1000,
      currency: 'usd',
      clientSecret: 'pi_1234567890_secret_abcdef',
      provider: 'stripe',
    });
  });

  it('should default currency to usd when not provided', async () => {
    const mockPaymentIntent = {
      id: 'pi_1234567890',
      amount: 500,
      currency: 'usd',
      client_secret: 'pi_1234567890_secret_abcdef',
    };

    mockPaymentIntentsCreate.mockResolvedValue(mockPaymentIntent);

    const payload = {
      amount: 500,
    };

    const result = await createPaymentIntent(payload);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 500,
      currency: 'usd',
      metadata: {},
    });

    expect(result.currency).toBe('usd');
  });

  it('should throw error when amount is missing', async () => {
    await expect(createPaymentIntent({})).rejects.toThrow('amount is required and must be a positive integer');
  });

  it('should throw error when amount is not a positive integer', async () => {
    await expect(createPaymentIntent({ amount: -100 })).rejects.toThrow('amount is required and must be a positive integer');
    await expect(createPaymentIntent({ amount: 0 })).rejects.toThrow('amount is required and must be a positive integer');
    await expect(createPaymentIntent({ amount: 10.5 })).rejects.toThrow('amount is required and must be a positive integer');
    await expect(createPaymentIntent({ amount: '100' })).rejects.toThrow('amount is required and must be a positive integer');
  });

  it('should re-throw Stripe errors with original message', async () => {
    const stripeError = new Error('Your card was declined.');
    stripeError.type = 'StripeCardError';

    mockPaymentIntentsCreate.mockRejectedValue(stripeError);

    await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow('Your card was declined.');
  });
});

// Integration/smoke test - only runs when STRIPE_SMOKE_TEST env flag is set
if (process.env.STRIPE_SMOKE_TEST) {
  describe('createPaymentIntent integration', () => {
    it('should create a real test-mode PaymentIntent', async () => {
      const payload = {
        amount: 1000,
        currency: 'usd',
      };

      const result = await createPaymentIntent(payload);

      expect(result.paymentId).toMatch(/^pi_/);
      expect(result.clientSecret).toMatch(/^pi_.*_secret_/);
      expect(result.amount).toBe(1000);
      expect(result.currency).toBe('usd');
      expect(result.provider).toBe('stripe');
    });
  });
}