import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("PaymentService - Validation checks", async (t) => {
  await t.test("throws error when payload is missing", async () => {
    await assert.rejects(
      async () => await createPaymentIntent(null),
      { message: "Payment payload is required" }
    );
  });

  await t.test("throws error when amount is missing", async () => {
    await assert.rejects(
      async () => await createPaymentIntent({}),
      { message: "payload.amount is required" }
    );
  });

  await t.test("throws error when amount is not a positive integer", async () => {
    for (const invalidAmount of [-500, 0, 10.5, "1000", NaN]) {
      await assert.rejects(
        async () => await createPaymentIntent({ amount: invalidAmount }),
        { message: "payload.amount must be a positive integer (smallest currency unit, e.g. cents)" }
      );
    }
  });
});

test("PaymentService - Unit test with mocked Stripe client", async (t) => {
  await t.test("calls stripe.paymentIntents.create with correct arguments and defaults", async () => {
    let capturedParams = null;
    const mockStripe = {
      paymentIntents: {
        create: async (params) => {
          capturedParams = params;
          return {
            id: "pi_test_123456789",
            client_secret: "pi_test_123456789_secret_abc123",
            amount: params.amount,
            currency: params.currency,
            status: "requires_payment_method"
          };
        }
      }
    };

    const result = await createPaymentIntent(
      { amount: 5000 },
      { stripeClient: mockStripe }
    );

    assert.deepEqual(capturedParams, {
      amount: 5000,
      currency: "usd"
    });

    assert.equal(result.paymentId, "pi_test_123456789");
    assert.equal(result.clientSecret, "pi_test_123456789_secret_abc123");
    assert.equal(result.amount, 5000);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
    assert.equal(result.status, "requires_payment_method");
    assert.equal(result.paymentId.startsWith("pay_"), false, "Stub pay_ id generation must be removed");
  });

  await t.test("preserves custom currency in lowercase and metadata", async () => {
    let capturedParams = null;
    const mockStripe = {
      paymentIntents: {
        create: async (params) => {
          capturedParams = params;
          return {
            id: "pi_eur_987",
            client_secret: "pi_eur_987_secret_xyz",
            amount: params.amount,
            currency: params.currency,
            status: "requires_payment_method"
          };
        }
      }
    };

    const result = await createPaymentIntent(
      { amount: 2500, currency: "EUR", metadata: { jobId: "job_99" } },
      { stripeClient: mockStripe }
    );

    assert.equal(capturedParams.currency, "eur");
    assert.deepEqual(capturedParams.metadata, { jobId: "job_99" });
    assert.equal(result.paymentId, "pi_eur_987");
  });

  await t.test("catches and preserves Stripe error message", async () => {
    const mockStripe = {
      paymentIntents: {
        create: async () => {
          const err = new Error("Your card was declined.");
          err.name = "StripeCardError";
          err.type = "card_error";
          err.code = "card_declined";
          throw err;
        }
      }
    };

    await assert.rejects(
      async () => await createPaymentIntent({ amount: 1000 }, { stripeClient: mockStripe }),
      (err) => {
        assert.equal(err.message, "Your card was declined.");
        assert.equal(err.name, "StripeCardError");
        assert.equal(err.type, "card_error");
        assert.equal(err.code, "card_declined");
        return true;
      }
    );
  });
});

test("PaymentService - Integration test against live test Stripe API (env guarded)", async (t) => {
  if (!process.env.RUN_STRIPE_INTEGRATION_TESTS || !process.env.STRIPE_SECRET_KEY) {
    t.skip("Skipping live Stripe integration test (RUN_STRIPE_INTEGRATION_TESTS not set)");
    return;
  }

  const result = await createPaymentIntent({ amount: 1000, currency: "usd" });
  assert.ok(result.paymentId.startsWith("pi_"));
  assert.ok(result.clientSecret.includes("_secret_"));
  assert.equal(result.amount, 1000);
  assert.equal(result.currency, "usd");
});
