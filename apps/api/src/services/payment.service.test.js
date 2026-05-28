import { jest } from '@jest/globals';

const mockCreate = jest.fn();

jest.unstable_mockModule('stripe', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      paymentIntents: {
        create: mockCreate,
      },
    })),
  };
});

const { createPaymentIntent } = await import('./payment.service.js');

describe('createPaymentIntent', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  describe('validation', () => {
    it('throws when payload is missing', async () => {
      await expect(createPaymentIntent()).rejects.toThrow(
        'Payload is required and must be an object'
      );
    });

    it('throws when amount is missing', async () => {
      await expect(createPaymentIntent({ currency: 'usd' })).rejects.toThrow(
        'amount is required and must be a positive integer'
      );
    });

    it('throws when amount is not an integer', async () => {
      await expect(createPaymentIntent({ amount: 10.5 })).rejects.toThrow(
        'amount is required and must be a positive integer'
      );
    });

    it('throws when amount is not positive', async () => {
      await expect(createPaymentIntent({ amount: 0 })).rejects.toThrow(
        'amount is required and must be a positive integer'
      );
      await expect(createPaymentIntent({ amount: -10 })).rejects.toThrow(
        'amount is required and must be a positive integer'
      );
    });
  });

  describe('Stripe API call', () => {
    it('calls paymentIntents.create with amount and currency', async () => {
      mockCreate.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
      });

      const result = await createPaymentIntent({
        amount: 1000,
        currency: 'eur',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'eur',
      });
      expect(result).toEqual({
        paymentId: 'pi_test_123',
        amount: 1000,
        currency: 'eur',
        provider: 'stripe',
        clientSecret: 'pi_test_123_secret',
      });
    });

    it('defaults currency to usd', async () => {
      mockCreate.mockResolvedValue({
        id: 'pi_test_456',
        client_secret: 'pi_test_456_secret',
      });

      await createPaymentIntent({ amount: 500 });

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 500,
        currency: 'usd',
      });
    });
  });

  describe('error handling', () => {
    it('re-throws Stripe errors with original message', async () => {
      const stripeError = new Error('Your card was declined.');
      stripeError.type = 'StripeCardError';
      mockCreate.mockRejectedValue(stripeError);

      await expect(createPaymentIntent({ amount: 100 })).rejects.toThrow(
        'Your card was declined.'
      );
    });

    it('re-throws non-Stripe errors as-is', async () => {
      const genericError = new Error('Network failure');
      mockCreate.mockRejectedValue(genericError);

      await expect(createPaymentIntent({ amount: 100 })).rejects.toThrow(
        'Network failure'
      );
    });
  });
});