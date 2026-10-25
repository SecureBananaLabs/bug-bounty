import { createPaymentIntent } from '../../src/payment';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Guard integration tests with an environment flag
const RUN_INTEGRATION_TESTS = process.env.RUN_INTEGRATION_TESTS === 'true';

describe('createPaymentIntent (Integration Tests)', () => {
  // Skip all tests in this suite if RUN_INTEGRATION_TESTS is not true
  beforeAll(() => {
    if (!RUN_INTEGRATION_TESTS) {
      console.warn('Skipping integration tests. Set RUN_INTEGRATION_TESTS=true in your .env to enable.');
    }
  });

  // Acceptance Criteria: Integration/smoke test confirms a test-mode PaymentIntent is created
  (RUN_INTEGRATION_TESTS ? test : test.skip)(
    'should successfully create a PaymentIntent against the real Stripe API',
    async () => {
      // Ensure you have a valid STRIPE_SECRET_KEY in your .env for this to pass
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not set. Cannot run integration test.');
      }

      const payload = {
        amount: 1000, // 10 USD in cents
        currency: 'usd',
      };

      const result = await createPaymentIntent(payload);

      expect(result).toBeDefined();
      expect(result.paymentId).toMatch(/^pi_[a-zA-Z0-9]+$/); // Stripe PaymentIntent ID format
      expect(result.clientSecret).toMatch(/^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/); // Stripe Client Secret format
      expect(typeof result.paymentId).toBe('string');
      expect(typeof result.clientSecret).toBe('string');
    },
    30000 // Increase timeout for API calls (30 seconds)
  );

  (RUN_INTEGRATION_TESTS ? test : test.skip)(
    'should handle an invalid Stripe API key error',
    async () => {
      // Temporarily override the secret key to an invalid one for this test
      const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_invalid_key';

      const payload = {
        amount: 1000,
        currency: 'usd',
      };

      try {
        await createPaymentIntent(payload);
        // If it reaches here, the test failed because it didn't throw an error
        fail('Expected createPaymentIntent to throw an error for invalid API key');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Stripe Error: Invalid API Key provided');
      } finally {
        // Restore the original secret key
        process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
      }
    },
    30000
  );
});
