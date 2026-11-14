import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createPaymentIntent } from '../services/paymentService.js';

describe('Payment Service Integration Test', () => {
  /**
   * This test makes a real call to Stripe API.
   * It is skipped unless RUN_STRIPE_INTEGRATION_TESTS is set to true.
   */
  test('creates a real Stripe PaymentIntent', { skip: !process.env.RUN_STRIPE_INTEGRATION_TESTS }, async () => {
    if (!process.env.STRIPE_SECRET_KEY) {
      assert.fail('STRIPE_SECRET_KEY environment variable is required for integration tests');
    }

    // Amount: 2000 cents ($20.00)
    const payload = { amount: 2000, currency: 'usd' };
    
    try {
      const result = await createPaymentIntent(payload);

      assert.ok(result.clientSecret, 'Result should include clientSecret');
      assert.ok(result.paymentId, 'Result should include paymentId');
      assert.ok(result.paymentId.startsWith('pi_'), 'Payment ID should follow Stripe format (pi_...)');
    } catch (error) {
      assert.fail(`Integration test failed: ${error.message}`);
    }
  });
});
