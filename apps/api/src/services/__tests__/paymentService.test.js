import { createPaymentIntent } from '../paymentService';
import Stripe from 'stripe';

jest.mock('stripe');

describe('Payment Service', () => {
  const mockPaymentIntent = {
    id: 'pi_123456789',
    client_secret: 'pi_123456789_secret_987654321',
    amount: 2000,
    currency: 'usd'
  };

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
    Stripe.mockClear();
  });

  describe('createPaymentIntent', () => {
    it('should validate amount is required', async () => {
      await expect(createPaymentIntent({ currency: 'usd' }))
        .rejects
        .toThrow('Amount is required');
    });

    it('should validate amount is positive integer', async () => {
      await expect(createPaymentIntent({ amount: -100 }))
        .rejects
        .toThrow('Amount must be a positive integer');
      
      await expect(createPaymentIntent({ amount: 10.5 }))
        .rejects
        .toThrow('Amount must be a positive integer');
    });

    it('should create payment intent with Stripe', async () => {
      const mockCreate = jest.fn().mockResolvedValue(mockPaymentIntent);
      Stripe.mockImplementation(() => ({
        paymentIntents: {
          create: mockCreate
        }
      }));

      const payload = { amount: 2000, currency: 'usd' };
      const result = await createPaymentIntent(payload);

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 2000,
        currency: 'usd'
      });

      expect(result).toEqual({
        paymentId: 'pi_123456789',
        clientSecret: 'pi_123456789_secret_987654321',
        amount: 2000,
        currency: 'usd',
        provider: 'stripe'
      });
    });
  });
});