/**
 * Tests for Payment Service - Stripe Integration
 */

const { createPaymentIntent, validatePaymentPayload } = require('../services/payment-service');

// Mock Stripe SDK
jest.mock('stripe');
const Stripe = require('stripe');

describe('Payment Service', () => {
  let mockStripe;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Set up mock for each test
    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
      },
    };
    Stripe.mockImplementation(() => mockStripe);
    // Re-require to pick up mocked stripe
    jest.resetModules();
  });

  describe('validatePaymentPayload', () => {
    test('should validate correct payload', () => {
      const result = validatePaymentPayload({ amount: 1000, currency: 'usd' });
      expect(result.amount).toBe(1000);
      expect(result.currency).toBe('usd');
    });

    test('should default currency to usd', () => {
      const result = validatePaymentPayload({ amount: 1000 });
      expect(result.currency).toBe('usd');
    });

    test('should reject missing amount', () => {
      expect(() => validatePaymentPayload({ currency: 'usd' })).toThrow('Amount is required');
    });

    test('should reject non-integer amount', () => {
      expect(() => validatePaymentPayload({ amount: 10.5 })).toThrow('positive integer');
    });

    test('should reject negative amount', () => {
      expect(() => validatePaymentPayload({ amount: -100 })).toThrow('positive integer');
    });

    test('should reject zero amount', () => {
      expect(() => validatePaymentPayload({ amount: 0 })).toThrow('positive integer');
    });

    test('should reject null payload', () => {
      expect(() => validatePaymentPayload(null)).toThrow('non-null object');
    });

    test('should reject undefined payload', () => {
      expect(() => validatePaymentPayload(undefined)).toThrow('non-null object');
    });
  });

  describe('createPaymentIntent', () => {
    test('should call stripe.paymentIntents.create with correct args', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_xyz',
        amount: 1000,
        currency: 'usd',
        status: 'requires_payment_method',
        created: 1234567890,
      });

      const result = await createPaymentIntent({ amount: 1000, currency: 'usd' });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
        metadata: expect.objectContaining({
          created_via: 'bug-bounty-payment-service',
        }),
      });
      expect(result.paymentId).toBe('pi_test123');
      expect(result.clientSecret).toBe('pi_test123_secret_xyz');
    });

    test('should handle Stripe card error', async () => {
      const error = new Error('Your card was declined');
      error.type = 'StripeCardError';
      mockStripe.paymentIntents.create.mockRejectedValue(error);

      await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow('Card error: Your card was declined');
    });

    test('should handle Stripe invalid request error', async () => {
      const error = new Error('Invalid amount');
      error.type = 'StripeInvalidRequestError';
      mockStripe.paymentIntents.create.mockRejectedValue(error);

      await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow('Invalid request: Invalid amount');
    });

    test('should handle generic Stripe API error', async () => {
      const error = new Error('API key error');
      error.type = 'StripeAPIError';
      mockStripe.paymentIntents.create.mockRejectedValue(error);

      await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow('Stripe API error: API key error');
    });
  });
});
