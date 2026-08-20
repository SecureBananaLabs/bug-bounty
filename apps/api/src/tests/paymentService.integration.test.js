import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createPaymentIntent } from '../services/paymentService.js';

describe('Payment Service Integration', () => {
  const runIntegrationTests = process.env.RUN_STRIPE_INTEGRATION_TESTS === 'true';

  if (!runIntegrationTests) {
    it('skipping integration tests because RUN_STRIPE_INTEGRATION_TESTS is not set to true', () => {
      assert.ok(true);
    });
    return;
  }

  it('successfully creates a test-mode PaymentIntent against the Stripe API', async () => {
    // Requires STRIPE_SECRET_KEY to be set in the environment to a valid test key
    assert.ok(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY is required for integration tests');

    const payload = {
      amount: 5000, // $50.00
      currency: 'usd'
    };

    const result = await createPaymentIntent(payload);

    assert.ok(result.clientSecret, 'Should have clientSecret');
    assert.ok(result.paymentId, 'Should have paymentId');
    assert.strictEqual(typeof result.clientSecret, 'string');
    assert.strictEqual(typeof result.paymentId, 'string');
    assert.ok(result.clientSecret.startsWith('pi_'), 'clientSecret should start with pi_');
  });
});
