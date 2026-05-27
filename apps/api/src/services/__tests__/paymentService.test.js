import { createPaymentIntent } from '../paymentService.js';
import Stripe from 'stripe';

jest.mock('stripe');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should validate amount is required', async () => {
      await expect(createPaymentIntent({}))
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

    it('should create payment intent with valid data', async () => {
      const mockPaymentIntent = {
        id: 'pi_123456789',
        client_secret: 'pi_123456789_secret_abcdefg'
      };
      
      Stripe.mockImplementation(() => ({
        paymentIntents: {
          create: jest.fn().mockResolvedValue(mockPaymentIntent)
        }
      }));

      const payload = { amount: 2000, currency: 'usd' };
      const result = await createPaymentIntent(payload);

      expect(result).toEqual({
        paymentId: 'pi_123456789',
        clientSecret: 'pi_123456789_secret_abcdefg',
        amount: 2000,
        currency: 'usd',
        provider: 'stripe'
      });
    });

    it('should default currency to usd', async () => {
      const mockPaymentIntent = {
        id: 'pi_123456789',
        client_secret: 'pi_123456789_secret_abcdefg'
      };
      
      Stripe.mockImplementation(() => ({
        paymentIntents: {
          create: jest.fn().mockResolvedValue(mockPaymentIntent)
        }
      }));

      await createPaymentIntent({ amount: 1500 });
      expect(Stripe().paymentIntents.create).toHaveBeenCalledWith({
        amount: 1500,
        currency: 'usd',
        metadata: {
          integration_check: 'accept_a_payment',
        },
      });
    });
  });
});