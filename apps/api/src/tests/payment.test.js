import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createPaymentIntent } from "../services/paymentService.js";

// Mock Stripe setup
let lastCreatePayload = null;
let mockCreateResponse = {
  id: "pi_test_123",
  client_secret: "secret_test_123"
};
let shouldThrowStripeError = false;

// Mock the property on Stripe instances using a prototype getter/setter
Object.defineProperty(Stripe.prototype, "paymentIntents", {
  get() {
    return {
      create: async (payload) => {
        lastCreatePayload = payload;
        if (shouldThrowStripeError) {
          throw new Error("Stripe card declined");
        }
        return mockCreateResponse;
      }
    };
  },
  set(val) {},
  configurable: true
});

test("createPaymentIntent - Unit Tests", async (t) => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";

  await t.test("should successfully create a payment intent and return clientSecret and paymentId", async () => {
    lastCreatePayload = null;
    shouldThrowStripeError = false;

    const result = await createPaymentIntent({
      amount: 5000,
      currency: "usd",
      metadata: { orderId: "123" }
    });

    assert.deepEqual(result, {
      clientSecret: "secret_test_123",
      paymentId: "pi_test_123"
    });

    assert.deepEqual(lastCreatePayload, {
      amount: 5000,
      currency: "usd",
      metadata: { orderId: "123" }
    });
  });

  await t.test("should default to usd if currency is not provided", async () => {
    lastCreatePayload = null;
    const result = await createPaymentIntent({ amount: 1000 });
    assert.equal(lastCreatePayload.currency, "usd");
  });

  await t.test("should throw an error if amount is missing", async () => {
    await assert.rejects(
      createPaymentIntent({ currency: "usd" }),
      /Amount is required/
    );
  });

  await t.test("should throw an error if amount is not a positive integer", async () => {
    await assert.rejects(
      createPaymentIntent({ amount: -100 }),
      /Amount must be a positive integer/
    );
    await assert.rejects(
      createPaymentIntent({ amount: 50.5 }),
      /Amount must be a positive integer/
    );
    await assert.rejects(
      createPaymentIntent({ amount: "500" }),
      /Amount must be a positive integer/
    );
  });

  await t.test("should catch and propagate Stripe errors", async () => {
    shouldThrowStripeError = true;
    await assert.rejects(
      createPaymentIntent({ amount: 2000 }),
      /Stripe card declined/
    );
  });
});

// Integration / Smoke test guarded by env variable
if (process.env.RUN_STRIPE_INTEGRATION_TESTS === "true") {
  test("createPaymentIntent - Integration Test against Real Stripe API", async () => {
    // Requires real STRIPE_SECRET_KEY in environment
    const result = await createPaymentIntent({
      amount: 1000,
      currency: "usd",
      metadata: { test: "smoke_test" }
    });

    assert.ok(result.clientSecret);
    assert.ok(result.paymentId);
    assert.ok(result.paymentId.startsWith("pi_"));
    console.log("Integration test passed! Created real PaymentIntent:", result.paymentId);
  });
}
