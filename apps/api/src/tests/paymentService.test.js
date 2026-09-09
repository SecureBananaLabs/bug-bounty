import { test } from "node:test";
import assert from "node:assert";
import { createPaymentIntent } from "../services/paymentService.js";

// Mock Stripe module
let mockStripeInstance;
const createMockStripe = () => {
  return {
    paymentIntents: {
      create: async (config) => ({
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_abc",
        amount: config.amount,
        currency: config.currency,
        status: "requires_payment_method",
        ...config
      })
    }
  };
};

test("createPaymentIntent - valid payload creates intent and returns clientSecret", async () => {
  mockStripeInstance = createMockStripe();
  const payload = {
    amount: 1000,
    currency: "usd"
  };

  const result = await createPaymentIntent(payload);

  assert.strictEqual(result.clientSecret, "pi_test_123_secret_abc");
  assert.strictEqual(result.paymentId, "pi_test_123");
  assert.strictEqual(result.amount, 1000);
  assert.strictEqual(result.currency, "usd");
});

test("createPaymentIntent - defaults currency to usd if not provided", async () => {
  mockStripeInstance = createMockStripe();
  const payload = {
    amount: 5000
  };

  const result = await createPaymentIntent(payload);

  assert.strictEqual(result.currency, "usd");
});

test("createPaymentIntent - throws error if amount is missing", async () => {
  mockStripeInstance = createMockStripe();
  const payload = {
    currency: "usd"
  };

  try {
    await createPaymentIntent(payload);
    assert.fail("Expected error to be thrown");
  } catch (error) {
    assert(error.message.includes("Validation error"));
  }
});

test("createPaymentIntent - throws error if amount is not positive", async () => {
  mockStripeInstance = createMockStripe();
  const payload = {
    amount: -100,
    currency: "usd"
  };

  try {
    await createPaymentIntent(payload);
    assert.fail("Expected error to be thrown");
  } catch (error) {
    assert(error.message.includes("Validation error"));
  }
});

test("createPaymentIntent - throws error if amount is not an integer", async () => {
  mockStripeInstance = createMockStripe();
  const payload = {
    amount: 10.5,
    currency: "usd"
  };

  try {
    await createPaymentIntent(payload);
    assert.fail("Expected error to be thrown");
  } catch (error) {
    assert(error.message.includes("Validation error"));
  }
});

test("createPaymentIntent - removes stub id generation (pay_${Date.now()})", async () => {
  mockStripeInstance = createMockStripe();
  const payload = {
    amount: 2000,
    currency: "eur"
  };

  const result = await createPaymentIntent(payload);

  assert(!result.paymentId.startsWith("pay_"));
  assert.strictEqual(result.paymentId, "pi_test_123");
});
