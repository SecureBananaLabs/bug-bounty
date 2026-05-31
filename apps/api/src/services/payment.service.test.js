import { jest } from '@jest/globals';
import { createPaymentIntent } from './payment.service.js';

// Mock the stripe module
jest.unstable_mockModule('stripe', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      paymentIntents: {
        create: mockCreate,
      },
    })),
  };
});

let mockCreate;

describe('createPaymentIntent', () => {
  beforeEach(() => {
    mockCreate = jest.fn();
    jest.clearAllMocks();
  });

  describe('validation', () => {
    it('throws when amount is missing', async () => {
      await expect(createPaymentIntent({})).rejects.toThrow('amount is required and must be a positive integer');
    });

    it('throws when amount is not a number', async () => {
      await expect(createPaymentIntent({ amount: 'abc' })).rejects.toThrow('amount is required and must be a positive integer');
    });

    it('throws when amount is zero', async () => {
      await expect(createPaymentIntent({ amount: 0 })).rejects.toThrow('amount is required and must be a positive integer');
    });

    it('throws when amount is negative', async () => {
      await expect(createPaymentIntent({ amount: -100 })).rejects.toThrow('amount is required and must be a positive integer');
    });

    it('throws when amount is a float', async () => {
      await expect(createPaymentIntent({ amount: 10.5 })).rejects.toThrow('amount is required and must be a positive integer');
    });
  });

  describe('Stripe API call', () => {
    it('calls stripe.paymentIntents.create with correct arguments', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret',
        amount: 1000,
        currency: 'usd',
      };
      mockCreate.mockResolvedValue(mockPaymentIntent);

      const result = await createPaymentIntent({ amount: 1000 });

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
      });
      expect(result).toEqual({
        paymentId: 'pi_123',
        clientSecret: 'pi_123_secret',
        amount: 1000,
        currency: 'usd',
        provider: 'stripe',
      });
    });

    it('uses provided currency', async () => {
      const mockPaymentIntent = {
        id: 'pi_456',
        client_secret: 'pi_456_secret',
        amount: 500,
        currency: 'eur',
      };
      mockCreate.mockResolvedValue(mockPaymentIntent);

      await createPaymentIntent({ amount: 500, currency: 'eur' });

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 500,
        currency: 'eur',
      });
    });
  });

  describe('error handling', () => {
    it('re-throws Stripe errors with original message', async () => {
      const stripeError = new Error('Your card was declined.');
      stripeError.type = 'StripeCardError';
      mockCreate.mockRejectedValue(stripeError);

      await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow('Your card was declined.');
    });

    it('re-throws non-Stripe errors as-is', async () => {
      const genericError = new Error('Network failure');
      mockCreate.mockRejectedValue(genericError);

      await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow('Network failure');
    });
  });
});

// Integration/smoke test - only runs when STRIPE_SMOKE_TEST is set
if (process.env.STRIPE_SMOKE_TEST) {
  describe('createPaymentIntent integration', () => {
    it('creates a real test-mode PaymentIntent', async () => {
      const result = await createPaymentIntent({ amount: 100, currency: 'usd' });

      expect(result.paymentId).toMatch(/^pi_/);
      expect(result.clientSecret).toMatch(/^pi_.*_secret/);
      expect(result.amount).toBe(100);
      expect(result.currency).toBe('usd');
      expect(result.provider).toBe('stripe');
    });
  });
}