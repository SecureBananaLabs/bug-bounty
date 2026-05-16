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

describe('paymentService (Supreme Strategy v2)', () => {
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

    it('should throw 400 for negative amount', async () => {
      const payload = { amount: -100 };
      try {
        await createPaymentIntent(payload);
      } catch (e) {
        expect(e.status).toBe(400);
        expect(e.message).toContain('Validation Error');
      }
    });

    it('should throw 400 for invalid metadata key length', async () => {
       const payload = { 
         amount: 1000, 
         metadata: { ["a".repeat(41)]: "value" } 
       };
       try {
         await createPaymentIntent(payload);
       } catch (e) {
         expect(e.status).toBe(400);
         expect(e.message).toContain('Metadata key exceeds 40 characters');
       }
    });

    it('should throw 400 for too many metadata keys', async () => {
       const largeMetadata = {};
       for(let i=0; i<51; i++) largeMetadata[`key${i}`] = "val";
       
       const payload = { amount: 1000, metadata: largeMetadata };
       try {
         await createPaymentIntent(payload);
       } catch (e) {
         expect(e.status).toBe(400);
         expect(e.message).toContain('Metadata cannot have more than 50 keys');
       }
    });

    it('should map Stripe auth error (401) to 502 Bad Gateway', async () => {
      const payload = { amount: 1000 };
      const stripeError = new Error('Invalid API Key');
      stripeError.type = 'StripeAuthenticationError';
      stripeError.statusCode = 401;
      
      mockCreate.mockRejectedValue(stripeError);

      try {
        await createPaymentIntent(payload);
      } catch (e) {
        expect(e.status).toBe(502);
        expect(e.message).toBe('Invalid API Key');
      }
    });
  });
});
