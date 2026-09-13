import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

/**
 * Build a mock Stripe client with a controllable paymentIntents.create.
 */
function mockStripe(implementation) {
  const fn = mock.fn(implementation);
  return {
    paymentIntents: { create: fn },
    /** Convenience: access the mock fn for assertions. */
    _mockCreate: fn,
  };
}

// ── Tests ────────────────────────────────────────────────────────

describe("createPaymentIntent (with injected stripe client)", () => {
  // ── Validation: payload ──
  it("throws TypeError if payload is missing", async () => {
    await assert.rejects(
      () => createPaymentIntent(),
      /payload is required/,
    );
  });

  it("throws TypeError if payload is not an object", async () => {
    await assert.rejects(
      () => createPaymentIntent("not-an-object"),
      /payload is required/,
    );
  });

  // ── Validation: amount ──
  it("throws Error if amount is missing", async () => {
    await assert.rejects(
      () => createPaymentIntent({}),
      /amount is required/,
    );
  });

  it("throws Error if amount is not a positive integer", async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: -50 }),
      /positive integer/,
    );
  });

  it("throws Error if amount is zero", async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 0 }),
      /positive integer/,
    );
  });

  it("throws Error if amount is a float", async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 10.5 }),
      /positive integer/,
    );
  });

  // ── Defaults and customisation ──
  it("defaults currency to 'usd' when not provided", async () => {
    const stripe = mockStripe(async () => ({
      id: "pi_mock_001",
      client_secret: "pi_mock_001_secret_abc",
      object: "payment_intent",
    }));

    const result = await createPaymentIntent({ amount: 2000 }, stripe);

    assert.equal(result.paymentId, "pi_mock_001");
    assert.equal(result.clientSecret, "pi_mock_001_secret_abc");

    const callArgs = stripe._mockCreate.mock.calls[0].arguments[0];
    assert.equal(callArgs.amount, 2000);
    assert.equal(callArgs.currency, "usd");
  });

  it("accepts a custom currency", async () => {
    const stripe = mockStripe(async () => ({
      id: "pi_mock_002",
      client_secret: "pi_mock_002_secret_def",
      object: "payment_intent",
    }));

    const result = await createPaymentIntent({ amount: 1000, currency: "eur" }, stripe);

    assert.equal(result.paymentId, "pi_mock_002");
    assert.equal(result.clientSecret, "pi_mock_002_secret_def");

    const callArgs = stripe._mockCreate.mock.calls[0].arguments[0];
    assert.equal(callArgs.amount, 1000);
    assert.equal(callArgs.currency, "eur");
  });

  // ── Successful creation ──
  it("creates a PaymentIntent with the expected shape", async () => {
    const fakeIntent = {
      id: "pi_3ABC123",
      client_secret: "pi_3ABC123_secret_XYZ",
      object: "payment_intent",
      amount: 5000,
      currency: "gbp",
    };

    const stripe = mockStripe(async () => fakeIntent);

    const result = await createPaymentIntent({ amount: 5000, currency: "gbp" }, stripe);

    assert.equal(result.paymentId, fakeIntent.id);
    assert.equal(result.clientSecret, fakeIntent.client_secret);

    const callArgs = stripe._mockCreate.mock.calls[0].arguments[0];
    assert.equal(callArgs.amount, 5000);
    assert.equal(callArgs.currency, "gbp");
    assert.deepEqual(callArgs.metadata, {});
    assert.ok(callArgs.automatic_payment_methods.enabled);
  });

  it("passes metadata through to Stripe", async () => {
    const stripe = mockStripe(async (opts) => ({
      id: "pi_meta_001",
      client_secret: "pi_meta_001_secret",
      object: "payment_intent",
      ...opts,
    }));

    const meta = { orderId: "ORD-123", customerId: "CUS-456" };
    await createPaymentIntent({ amount: 1500, currency: "usd", metadata: meta }, stripe);

    const callArgs = stripe._mockCreate.mock.calls[0].arguments[0];
    assert.deepEqual(callArgs.metadata, meta);
  });

  // ── Error handling ──
  it("re-throws Stripe errors with a descriptive message", async () => {
    const stripeError = new Error("Invalid API key provided");
    stripeError.type = "invalid_request_error";
    stripeError.code = "invalid_api_key";
    stripeError.statusCode = 401;

    const stripe = mockStripe(async () => { throw stripeError; });

    await assert.rejects(
      () => createPaymentIntent({ amount: 2000 }, stripe),
      /Invalid API key provided/,
    );
  });

  it("preserves Stripe error metadata on the re-thrown error", async () => {
    const stripeError = new Error("You did not provide an API key.");
    stripeError.type = "invalid_request_error";
    stripeError.code = "api_key_missing";
    stripeError.statusCode = 401;

    const stripe = mockStripe(async () => { throw stripeError; });

    try {
      await createPaymentIntent({ amount: 2000 }, stripe);
      assert.fail("Should have thrown");
    } catch (err) {
      assert.equal(err.stripeCode, "api_key_missing");
      assert.equal(err.stripeType, "invalid_request_error");
      assert.ok(err.originalError === stripeError);
    }
  });

  // ── Env-based stripe initialisation (integration guard) ──
  it("throws a clear error if STRIPE_SECRET_KEY is missing and no client injected", async () => {
    const key = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      await assert.rejects(
        () => createPaymentIntent({ amount: 2000 }),
        /STRIPE_SECRET_KEY/,
      );
    } finally {
      if (key) process.env.STRIPE_SECRET_KEY = key;
    }
  });
});
