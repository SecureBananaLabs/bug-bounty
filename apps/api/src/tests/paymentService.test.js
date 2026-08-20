import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

mock.module('stripe', {
  defaultExport: class StripeMock {
    constructor() {
      this.paymentIntents = {
        create: mock.fn(async (params) => {
          if (params.amount === 99999) {
            const err = new Error('Your card was declined.');
            err.type = 'StripeCardError';
            throw err;
          }
          if (params.amount === 88888) {
            throw 'string_error_fallback';
          }
          return {
            client_secret: 'pi_test_secret_' + params.currency,
            id: 'pi_mocked123'
          };
        })
      };
    }
  }
});

const { createPaymentIntent, resetStripeClientForTest } = await import('../services/paymentService.js');

describe('Payment Service', () => {
  let originalEnvKey;

  beforeEach(() => {
    originalEnvKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'test_secret_key';
    resetStripeClientForTest();
  });

  afterEach(() => {
    if (originalEnvKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalEnvKey;
    }
    resetStripeClientForTest();
  });

  describe('createPaymentIntent', () => {
    it('throws error if STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      await assert.rejects(
        () => createPaymentIntent({ amount: 1000 }),
        { message: 'STRIPE_SECRET_KEY is not defined' }
      );
    });

    it('throws error if amount is missing', async () => {
      await assert.rejects(
        () => createPaymentIntent({}),
        { message: 'Invalid amount: must be a positive integer.' }
      );
    });

    it('throws error if amount is not positive integer', async () => {
      await assert.rejects(
        () => createPaymentIntent({ amount: -100 }),
        { message: 'Invalid amount: must be a positive integer.' }
      );
      await assert.rejects(
        () => createPaymentIntent({ amount: 10.5 }),
        { message: 'Invalid amount: must be a positive integer.' }
      );
    });

    it('defaults currency to usd if not provided', async () => {
      const result = await createPaymentIntent({ amount: 1000 });
      assert.deepStrictEqual(result, { clientSecret: 'pi_test_secret_usd', paymentId: 'pi_mocked123' });
    });

    it('uses provided currency', async () => {
      const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });
      assert.deepStrictEqual(result, { clientSecret: 'pi_test_secret_eur', paymentId: 'pi_mocked123' });
    });

    it('re-throws stripe errors with preserved message and properties', async () => {
      try {
        await createPaymentIntent({ amount: 99999 });
        assert.fail('Should have thrown');
      } catch (err) {
        assert.strictEqual(err.message, 'Your card was declined.');
        assert.strictEqual(err.name, 'StripeCardError');
        assert.ok(err.raw);
      }
    });

    it('handles unexpected non-Error throws gracefully', async () => {
      try {
        await createPaymentIntent({ amount: 88888 });
        assert.fail('Should have thrown');
      } catch (err) {
        assert.strictEqual(err.message, 'string_error_fallback');
        assert.strictEqual(err.name, 'StripeError');
      }
    });
  });
});
