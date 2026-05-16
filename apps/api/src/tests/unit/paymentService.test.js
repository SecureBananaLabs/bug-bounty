import { jest } from '@jest/globals';

const mockCreate = jest.fn();

// Use unstable_mockModule for ESM mocking
jest.unstable_mockModule('stripe', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      paymentIntents: {
        create: mockCreate
      }
    }))
  };
});

const { createPaymentIntent } = await import('../../services/paymentService.js');

describe('paymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should successfully create a PaymentIntent with valid input', async () => {
      const payload = { amount: 2000, currency: 'usd' };
      const mockResponse = {
        id: 'pi_123',
        client_secret: 'pi_123_secret_456'
      };
      
      mockCreate.mockResolvedValue(mockResponse);

      const result = await createPaymentIntent(payload);

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 2000,
        currency: 'usd',
        metadata: undefined
      });
      
      expect(result).toEqual({
        paymentId: 'pi_123',
        clientSecret: 'pi_123_secret_456',
        provider: 'stripe'
      });
    });

    it('should throw validation error for negative amount', async () => {
      const payload = { amount: -100 };
      await expect(createPaymentIntent(payload)).rejects.toThrow('Validation Error');
    });

    it('should throw validation error for missing amount', async () => {
      const payload = { currency: 'usd' };
      await expect(createPaymentIntent(payload)).rejects.toThrow('Validation Error');
    });

    it('should use default currency if not provided', async () => {
       const payload = { amount: 1000 };
       mockCreate.mockResolvedValue({
         id: 'pi_default',
         client_secret: 'secret_default'
       });

       await createPaymentIntent(payload);

       expect(mockCreate).toHaveBeenCalledWith(
         expect.objectContaining({ currency: 'usd' })
       );
    });

    it('should preserve Stripe error messages', async () => {
      const payload = { amount: 1000 };
      const stripeError = new Error('Your card was declined.');
      stripeError.type = 'StripeCardError';
      
      mockCreate.mockRejectedValue(stripeError);

      await expect(createPaymentIntent(payload)).rejects.toThrow('Your card was declined.');
    });
  });
});
