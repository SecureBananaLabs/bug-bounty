import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import { createPaymentIntent, stripe } from "../services/paymentService.js";

test("paymentService - createPaymentIntent validation errors", async (t) => {
  await t.test("should throw error if amount is missing", async () => {
    await assert.rejects(
      createPaymentIntent({}),
      { message: "Amount is required" }
    );
  });

  await t.test("should throw error if amount is not positive", async () => {
    await assert.rejects(
      createPaymentIntent({ amount: 0 }),
      { message: "Amount must be a positive integer" }
    );
    await assert.rejects(
      createPaymentIntent({ amount: -50 }),
      { message: "Amount must be a positive integer" }
    );
  });

  await t.test("should throw error if amount is not an integer", async () => {
    await assert.rejects(
      createPaymentIntent({ amount: 10.5 }),
      { message: "Amount must be a positive integer" }
    );
  });
});

test("paymentService - createPaymentIntent success with mocked Stripe SDK", async (t) => {
  const mockIntent = {
    id: "pi_12345",
    client_secret: "secret_12345",
  };

  // Mock Stripe create method directly on the exported stripe instance
  const createMock = mock.fn(() => Promise.resolve(mockIntent));
  mock.method(stripe.paymentIntents, "create", createMock);

  const result = await createPaymentIntent({ amount: 1000, currency: "usd" });

  assert.equal(result.paymentId, "pi_12345");
  assert.equal(result.clientSecret, "secret_12345");

  assert.equal(createMock.mock.calls.length, 1);
  const callArgs = createMock.mock.calls[0].arguments[0];
  assert.equal(callArgs.amount, 1000);
  assert.equal(callArgs.currency, "usd");

  mock.restoreAll();
});

test("paymentService - createPaymentIntent normalizes currency to lowercase", async (t) => {
  const mockIntent = {
    id: "pi_67890",
    client_secret: "secret_67890",
  };

  const createMock = mock.fn(() => Promise.resolve(mockIntent));
  mock.method(stripe.paymentIntents, "create", createMock);

  const result = await createPaymentIntent({ amount: 1000, currency: "EUR" });

  assert.equal(result.paymentId, "pi_67890");
  assert.equal(createMock.mock.calls.length, 1);
  const callArgs = createMock.mock.calls[0].arguments[0];
  assert.equal(callArgs.currency, "eur");

  mock.restoreAll();
});

test("paymentService - createPaymentIntent handles Stripe errors", async (t) => {
  const stripeError = new Error("Card declined");
  stripeError.type = "StripeCardError";

  mock.method(stripe.paymentIntents, "create", () => Promise.reject(stripeError));

  await assert.rejects(
    createPaymentIntent({ amount: 1000, currency: "usd" }),
    { message: "Card declined" }
  );

  mock.restoreAll();
});

// Smoke/Integration test guarded by env flag
if (process.env.RUN_STRIPE_SMOKE_TEST && process.env.STRIPE_SECRET_KEY) {
  test("paymentService - Stripe API smoke test", async () => {
    const result = await createPaymentIntent({ amount: 2000, currency: "usd" });
    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
  });
}
