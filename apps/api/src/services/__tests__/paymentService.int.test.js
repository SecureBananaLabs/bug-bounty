import { createPaymentIntent } from '../paymentService';

// Integration test - only run when explicitly enabled
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

(runIntegrationTests ? describe : describe.skip)('Payment Service Integration', () => {
  // Note: This requires a valid STRIPE_SECRET_KEY in environment
  describe('createPaymentIntent with real Stripe API', () => {
    it('should create a payment intent in test mode', async () => {
      // This test uses real Stripe API in test mode
      const payload = {
        amount: 2000, // $20.00 in cents
        currency: 'usd'
      };

      const result = await createPaymentIntent(payload);

      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('clientSecret');
      expect(result.paymentId).toMatch(/^pi_/);
      expect(result.clientSecret).toMatch(/_secret_/);
      expect(result.amount).toBe(2000);
      expect(result.currency).toBe('usd');
      expect(result.provider).toBe('stripe');
    });

    it('should handle Stripe API errors gracefully', async () => {
      const payload = {
        amount: 2000,
        currency: 'invalid_currency'
      };

      await expect(createPaymentIntent(payload)).rejects.toThrow();
    });
  });
});