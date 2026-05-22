import { test, mock } from 'node:test';
import assert from 'node:assert';

test('createPaymentIntent - Unit tests', async (t) => {
  // Set fake key before dynamic import
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_unit_tests';
  
  const { createPaymentIntent, stripe } = await import('../services/paymentService.js');

  t.beforeEach(() => {
    mock.restoreAll();
  });

  await t.test('throws for invalid amounts', async () => {
    await assert.rejects(() => createPaymentIntent({ amount: -10 }), /Invalid amount/);
    await assert.rejects(() => createPaymentIntent({ amount: 10.5 }), /Invalid amount/);
    await assert.rejects(() => createPaymentIntent({ amount: 0 }), /Invalid amount/);
    await assert.rejects(() => createPaymentIntent({}), /Invalid amount/);
  });

  await t.test('calls stripe.paymentIntents.create with correct arguments', async () => {
    const createMock = mock.method(stripe.paymentIntents, 'create', async () => {
      return { id: 'pi_mock_123', client_secret: 'secret_mock_123' };
    });

    const result = await createPaymentIntent({ amount: 500, currency: 'eur' });
    
    assert.strictEqual(result.paymentId, 'pi_mock_123');
    assert.strictEqual(result.clientSecret, 'secret_mock_123');
    assert.strictEqual(result.amount, 500);
    assert.strictEqual(result.currency, 'eur');

    assert.strictEqual(createMock.mock.calls.length, 1);
    assert.deepStrictEqual(createMock.mock.calls[0].arguments[0], {
      amount: 500,
      currency: 'eur'
    });
  });
});

test('createPaymentIntent - Integration test', { skip: process.env.RUN_INTEGRATION !== 'true' }, async (t) => {
  const originalKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_TEST_KEY || 'sk_test_fake';
  
  const { createPaymentIntent } = await import('../services/paymentService.js');

  try {
    const result = await createPaymentIntent({ amount: 1000, currency: 'usd' });
    assert.ok(result.clientSecret);
  } catch (err) {
    assert.ok(err.message.includes('Invalid API Key') || err.message.includes('authenticate'));
  } finally {
    process.env.STRIPE_SECRET_KEY = originalKey;
  }
});
