import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPaymentIntent } from './payment.service.js';

// Mock the stripe module
const mockCreate = vi.fn();

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: mockCreate,
      },
    })),
  };
});

describe('payment.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Preserve original env
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent with valid payload', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 1000,
        currency: 'usd',
      };

      mockCreate.mockResolvedValue(mockPaymentIntent);

      const result = await createPaymentIntent({
        amount: 1000,
        currency: 'usd',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
      });
      expect(result).toEqual({
        paymentId: 'pi_123',
        clientSecret: 'secret_123',
        amount: 1000,
        currency: 'usd',
        provider: 'stripe',
      });
    });

    it('should default currency to usd', async () => {
      const mockPaymentIntent = {
        id: 'pi_456',
        client_secret: 'secret_456',
        amount: 500,
        currency: 'usd',
      };

      mockCreate.mockResolvedValue(mockPaymentIntent);

      const result = await createPaymentIntent({ amount: 500 });

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 500,
        currency: 'usd',
      });
      expect(result.currency).toBe('usd');
    });

    it('should throw error when amount is missing', async () => {
      await expect(createPaymentIntent({})).rejects.toThrow(
        'amount is required and must be a positive integer'
      );
    });

    it('should throw error when amount is not a positive integer', async () => {
      await expect(createPaymentIntent({ amount: -1 })).rejects.toThrow(
        'amount is required and must be a positive integer'
      );
      await expect(createPaymentIntent({ amount: 0 })).rejects.toThrow(
        'amount is required and must be a positive integer'
      );
      await expect(createPaymentIntent({ amount: '100' })).rejects.toThrow(
        'amount is required and must be a positive integer'
      );
      await expect(createPaymentIntent({ amount: 10.5 })).rejects.toThrow(
        'amount is required and must be a positive integer'
      );
    });

    it('should re-throw Stripe errors with original message', async () => {
      const stripeError = new Error('Your card was declined.');
      stripeError.type = 'StripeCardError';
      mockCreate.mockRejectedValue(stripeError);

      await expect(createPaymentIntent({ amount: 100 })).rejects.toThrow(
        'Your card was declined.'
      );
    });
  });
});