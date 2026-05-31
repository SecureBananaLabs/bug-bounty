import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  _resetStripe,
} from "../services/paymentService.js";

/** Fake Stripe.paymentIntents.create() for unit tests */
class MockStripe {
  constructor() {
    this.calls = [];
  }
  paymentIntents = {
    create: async (params) => {
      this.calls.push(params);
      return {
        id: "pi_mock_" + Date.now(),
        client_secret: "pi_mock_" + Date.now() + "_secret_test",
        amount: params.amount,
        currency: params.currency,
      };
    },
  };
}

test("createPaymentIntent calls stripe.paymentIntents.create with correct params", async () => {
  const mockStripe = new MockStripe();
  _resetStripe(mockStripe);

  const result = await createPaymentIntent(
    { amount: 2000, currency: "usd" },
    { stripe: mockStripe }
  );

  assert.strictEqual(mockStripe.calls.length, 1);
  assert.deepStrictEqual(mockStripe.calls[0], { amount: 2000, currency: "usd" });

  assert.strictEqual(result.provider, "stripe");
  assert.strictEqual(result.amount, 2000);
  assert.strictEqual(result.currency, "usd");
  assert.ok(result.paymentId.startsWith("pi_mock_"));
  assert.ok(result.clientSecret.endsWith("_secret_test"));
});

test("createPaymentIntent defaults currency to usd", async () => {
  const mockStripe = new MockStripe();
  _resetStripe(mockStripe);

  await createPaymentIntent({ amount: 5000 }, { stripe: mockStripe });

  assert.deepStrictEqual(mockStripe.calls[0], { amount: 5000, currency: "usd" });
});

test("createPaymentIntent throws when amount is missing", async () => {
  _resetStripe(null);
  await assert.rejects(
    () => createPaymentIntent({}, { stripe: new MockStripe() }),
    /amount is required/
  );
});

test("createPaymentIntent throws when amount is not a positive integer", async () => {
  _resetStripe(null);
  const stripe = new MockStripe();

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripe }),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: -100 }, { stripe }),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 9.99 }, { stripe }),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: "1000" }, { stripe }),
    /positive integer/
  );
});

test("createPaymentIntent re-throws Stripe errors with original message", async () => {
  _resetStripe(null);
  const badStripe = {
    paymentIntents: {
      create: async () => {
        const err = new Error("Your card was declined.");
        err.type = "StripeCardError";
        err.message = "Your card was declined.";
        throw err;
      },
    },
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripe: badStripe }),
    /Your card was declined\./
  );
});

// ── Integration smoke test ──────────────────────────────────────────────────
// Set STRIPE_SECRET_KEY=sk_test_... and RUN_INTEGRATION_TESTS=1 to enable.
// Skipped in normal CI runs (no real credentials needed).
if (process.env.RUN_INTEGRATION_TESTS && process.env.STRIPE_SECRET_KEY) {
  test("createPaymentIntent creates a real test-mode PaymentIntent", async () => {
    _resetStripe(null); // force re-init from env
    const result = await createPaymentIntent({ amount: 200, currency: "usd" });

    assert.ok(result.paymentId.startsWith("pi_"));
    assert.ok(result.clientSecret.startsWith("pi_"));
    assert.strictEqual(result.amount, 200);
    assert.strictEqual(result.currency, "usd");
    assert.strictEqual(result.provider, "stripe");
  });
}

test("createPaymentIntent re-throws StripeInvalidRequestError", async () => {
  _resetStripe(null);
  const badStripe = {
    paymentIntents: {
      create: async () => {
        const err = new Error("Invalid API Key provided");
        err.type = "StripeInvalidRequestError";
        throw err;
      },
    },
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripe: badStripe }),
    /Invalid API Key/
  );
});
