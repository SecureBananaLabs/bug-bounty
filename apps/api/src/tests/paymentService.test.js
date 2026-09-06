import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent should create a stripe payment intent", async () => {
  // Mock stripe instance
  const mockStripeInstance = {
    paymentIntents: {
      create: async function(input) {
        assert.equal(input.amount, 1000);
        assert.equal(input.currency, 'usd');
        return {
          id: 'pi_test_123',
          client_secret: 'secret_test_123',
          amount: 1000,
          currency: 'usd'
        };
      }
    }
  };

  const payload = {
    amount: 1000,
    currency: "usd"
  };
  
  const result = await createPaymentIntent(payload, mockStripeInstance);
  
  assert.equal(result.paymentId, 'pi_test_123');
  assert.equal(result.clientSecret, 'secret_test_123');
  assert.equal(result.amount, 1000);
  assert.equal(result.currency, 'usd');
  assert.equal(result.provider, 'stripe');
});

test("createPaymentIntent should validate amount is required", async () => {
  let error;
  try {
    // We don't need stripe for validation, so we can pass a dummy
    await createPaymentIntent({}, {});
  } catch (err) {
    error = err;
  }
  
  assert.ok(error instanceof Error);
  assert.equal(error.message, 'Amount is required and must be a positive integer (in smallest currency unit, e.g. cents)');
});

test("createPaymentIntent should validate amount is positive integer", async () => {
  let error;
  try {
    await createPaymentIntent({ amount: -50 }, {});
  } catch (err) {
    error = err;
  }
  
  assert.ok(error instanceof Error);
  assert.equal(error.message, 'Amount is required and must be a positive integer (in smallest currency unit, e.g. cents)');
});

test("createPaymentIntent should default currency to usd", async () => {
  const mockStripeInstance = {
    paymentIntents: {
      create: async function(input) {
        assert.equal(input.amount, 500);
        assert.equal(input.currency, 'usd');
        return {
          id: 'pi_test_123',
          client_secret: 'secret_test_123',
          amount: 500,
          currency: 'usd'
        };
      }
    }
  };

  const payload = {
    amount: 500
  };
  
  const result = await createPaymentIntent(payload, mockStripeInstance);
  
  assert.equal(result.currency, 'usd');
});

test("createPaymentIntent should handle stripe errors", async () => {
  const mockStripeInstance = {
    paymentIntents: {
      create: async function() {
        throw new Error('Card was declined');
      }
    }
  };

  let error;
  try {
    await createPaymentIntent({ amount: 1000 }, mockStripeInstance);
  } catch (err) {
    error = err;
  }
  
  assert.ok(error instanceof Error);
  assert.equal(error.message, 'Stripe error: Card was declined');
});

test("createPaymentIntent should pass metadata to stripe", async () => {
  let capturedInput = null;
  const mockStripeInstance = {
    paymentIntents: {
      create: async function(input) {
        capturedInput = input;
        return {
          id: 'pi_test_123',
          client_secret: 'secret_test_123',
          amount: 1000,
          currency: 'eur'
        };
      }
    }
  };

  const payload = {
    amount: 1000,
    currency: "eur",
    metadata: { order_id: "order_123" }
  };
  
  await createPaymentIntent(payload, mockStripeInstance);
  
  assert.equal(capturedInput.amount, 1000);
  assert.equal(capturedInput.currency, 'eur');
  assert.deepEqual(capturedInput.metadata, { order_id: "order_123" });
});

test("createPaymentIntent should accept injected stripe instance", async () => {
  // This test is essentially the same as the first one, but we keep it for clarity
  const mockStripeInstance = {
    paymentIntents: {
      create: async function(input) {
        assert.equal(input.amount, 2000);
        assert.equal(input.currency, 'gbp');
        return {
          id: 'pi_injected_123',
          client_secret: 'secret_injected_123',
          amount: 2000,
          currency: 'gbp'
        };
      }
    }
  };

  const payload = {
    amount: 2000,
    currency: "gbp"
  };
  
  const result = await createPaymentIntent(payload, mockStripeInstance);
  
  assert.equal(result.paymentId, 'pi_injected_123');
  assert.equal(result.clientSecret, 'secret_injected_123');
  assert.equal(result.amount, 2000);
  assert.equal(result.currency, 'gbp');
  assert.equal(result.provider, 'stripe');
});
