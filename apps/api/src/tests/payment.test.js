import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, setStripeClient } from "../services/paymentService.js";

// Reset between tests
function resetClient() {
  delete process.env.STRIPE_SECRET_KEY;
  setStripeClient(null);
}

// --- Unit tests: input validation ---

test("validates amount — rejects zero", async () => {
  resetClient();
  await assert.rejects(
    () => createPaymentIntent({ amount: 0, currency: "usd" }),
    { message: "amount must be a positive integer (smallest currency unit, e.g. cents)" },
  );
});

test("validates amount — rejects negative", async () => {
  resetClient();
  await assert.rejects(
    () => createPaymentIntent({ amount: -100, currency: "usd" }),
    { message: "amount must be a positive integer (smallest currency unit, e.g. cents)" },
  );
});

test("validates amount — rejects float", async () => {
  resetClient();
  await assert.rejects(
    () => createPaymentIntent({ amount: 99.5, currency: "usd" }),
    { message: "amount must be a positive integer (smallest currency unit, e.g. cents)" },
  );
});

test("validates amount — rejects missing", async () => {
  resetClient();
  await assert.rejects(
    () => createPaymentIntent({ currency: "usd" }),
    { message: "amount must be a positive integer (smallest currency unit, e.g. cents)" },
  );
});

test("validates amount — rejects NaN", async () => {
  resetClient();
  await assert.rejects(
    () => createPaymentIntent({ amount: NaN, currency: "usd" }),
    { message: "amount must be a positive integer (smallest currency unit, e.g. cents)" },
  );
});

// --- Unit test: Stripe SDK mocked via dependency injection ---

test("calls stripe.paymentIntents.create() with correct arguments", async (t) => {
  const mockCreate = t.mock.fn(async ({ amount, currency }) => ({
    id: "pi_mock_123",
    client_secret: "pi_mock_123_secret_mock",
  }));

  setStripeClient({
    paymentIntents: { create: mockCreate },
  });

  const result = await createPaymentIntent({ amount: 2500, currency: "eur" });

  assert.equal(result.paymentId, "pi_mock_123");
  assert.equal(result.clientSecret, "pi_mock_123_secret_mock");
  assert.equal(mockCreate.mock.calls.length, 1, "create should be called once");
  assert.deepEqual(mockCreate.mock.calls[0].arguments[0], { amount: 2500, currency: "eur" });

  resetClient();
});

// --- Unit test: Stripe error handling ---

test("re-throws Stripe errors with original message", async (t) => {
  class StripeCardError extends Error {
    constructor(opts) {
      super(opts.message);
      this.name = "StripeCardError";
    }
    get type() {
      return "StripeCardError";
    }
  }

  setStripeClient({
    paymentIntents: {
      create: t.mock.fn(async () => {
        throw new StripeCardError({ message: "Your card was declined." });
      }),
    },
  });

  // The error won't be instanceof Stripe.errors.StripeError since we're not using Stripe import,
  // but it will be caught by the generic catch and re-thrown.
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    { message: "Your card was declined." },
  );

  resetClient();
});

// --- Unit test: Stripe key not set ---

test("throws when STRIPE_SECRET_KEY not set", async () => {
  resetClient();
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    { message: "STRIPE_SECRET_KEY environment variable is not set" },
  );
});

// --- Integration test (gated) ---

test("integration: creates a real PaymentIntent in Stripe test mode", { skip: !process.env.RUN_STRIPE_INTEGRATION_TESTS }, async () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_test_")) {
    assert.fail("STRIPE_SECRET_KEY must be a test mode key (sk_test_*) for integration tests");
  }

  const result = await createPaymentIntent({ amount: 1000, currency: "usd" });

  assert.ok(result.paymentId.startsWith("pi_"), "paymentId should start with pi_");
  assert.ok(result.clientSecret.startsWith("pi_"), "clientSecret should start with pi_");
});
