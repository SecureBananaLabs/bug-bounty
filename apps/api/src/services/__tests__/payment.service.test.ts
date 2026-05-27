import { createPaymentIntent } from '../payment.service';
import Stripe from 'stripe';

// Mock the Stripe SDK
jest.mock('stripe');

describe('Payment Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent with valid payload', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_123456789',
        client_secret: 'pi_123456789_secret_abcdef',
        amount: 1000,
        currency: 'usd',
      };

      // Mock the stripe.paymentIntents.create method
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.paymentIntents.create = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      const payload = {
        amount: 1000,
        currency: 'usd',
      };

      // Act
      const result = await createPaymentIntent(payload);

      // Assert
      expect(result).toEqual({
        paymentId: 'pi_123456789',
        clientSecret: 'pi_123456789_secret_abcdef',
        amount: 1000,
        currency: 'usd',
        provider: 'stripe',
      });

      // Verify stripe.paymentIntents.create was called with correct arguments
      expect(Stripe.prototype.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
      });
    });

    it('should throw error for invalid amount', async () => {
      const payload = {
        amount: -100,
        currency: 'usd',
      };

      await expect(createPaymentIntent(payload)).rejects.toThrow();
    });

    it('should handle stripe API errors', async () => {
      // Mock stripe to throw an error
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.paymentIntents.create = jest
        .fn()
        .mockRejectedValue(new Error('Stripe API error'));

      const payload = { amount: 1000, currency: 'usd' };

      await expect(createPaymentIntent(payload)).rejects.toThrow('Stripe API error');
    });
  });
});