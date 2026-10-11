import test, { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createPaymentIntent, stripe } from '../services/paymentService.js';

if (process.env.RUN_INTEGRATION_TESTS === 'true') {
  describe('createPaymentIntent (Integration)', () => {
    it('should create a real payment intent when a valid STRIPE_SECRET_KEY is provided', async () => {
      const result = await createPaymentIntent({ amount: 2000, currency: 'gbp' });
      assert.ok(result.paymentId.startsWith('pi_'));
      assert.ok(result.clientSecret.includes('_secret_'));
      assert.strictEqual(result.amount, 2000);
      assert.strictEqual(result.currency, 'gbp');
    });
  });
} else {
  describe('createPaymentIntent (Unit)', () => {
    it('should throw if amount is missing or invalid', async () => {
      await assert.rejects(createPaymentIntent({}), /Invalid amount/);
      await assert.rejects(createPaymentIntent({ amount: "100" }), /Invalid amount/);
      await assert.rejects(createPaymentIntent({ amount: -50 }), /Invalid amount/);
      await assert.rejects(createPaymentIntent({ amount: 10.5 }), /Invalid amount/);
    });

    it('should call stripe.paymentIntents.create and return mapped result', async () => {
      const createMock = mock.method(stripe.paymentIntents, 'create', async () => {
        return {
          id: 'pi_mock_123',
          client_secret: 'pi_mock_123_secret_456'
        };
      });

      const result = await createPaymentIntent({ amount: 5000 });
      
      assert.strictEqual(result.paymentId, 'pi_mock_123');
      assert.strictEqual(result.clientSecret, 'pi_mock_123_secret_456');
      assert.strictEqual(result.amount, 5000);
      assert.strictEqual(result.currency, 'usd');
      assert.strictEqual(result.provider, 'stripe');
      
      assert.strictEqual(createMock.mock.calls.length, 1);
      assert.deepStrictEqual(createMock.mock.calls[0].arguments[0], {
        amount: 5000,
        currency: 'usd'
      });
      
      createMock.mock.restore();
    });

    it('should handle custom currency', async () => {
      const createMock = mock.method(stripe.paymentIntents, 'create', async () => {
        return {
          id: 'pi_mock_123',
          client_secret: 'pi_mock_123_secret_456'
        };
      });

      const result = await createPaymentIntent({ amount: 1500, currency: 'eur' });
      assert.strictEqual(result.currency, 'eur');
      
      createMock.mock.restore();
    });
  });
}
