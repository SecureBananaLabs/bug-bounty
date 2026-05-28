import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  createStripePaymentIntent,
  PaymentServiceError
} from "../services/paymentService.js";

test("createStripePaymentIntent creates a Stripe PaymentIntent with required fields", async () => {
  const calls = [];
  const stripe = {
    paymentIntents: {
      async create(args) {
        calls.push(args);
        return {
          id: "pi_mock_123",
          client_secret: "pi_mock_123_secret_456"
        };
      }
    }
  };

  const result = await createStripePaymentIntent({ amount: 2500 }, stripe);

  assert.deepEqual(calls, [{ amount: 2500, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_mock_123",
    clientSecret: "pi_mock_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
  assert.ok(!result.paymentId.startsWith("pay_"));
});

test("createStripePaymentIntent preserves explicit currency and metadata", async () => {
  const calls = [];
  const stripe = {
    paymentIntents: {
      async create(args) {
        calls.push(args);
        return {
          id: "pi_mock_metadata",
          client_secret: "pi_mock_metadata_secret"
        };
      }
    }
  };

  await createStripePaymentIntent(
    {
      amount: 1000,
      currency: "EUR",
      metadata: { proposalId: "proposal_123" }
    },
    stripe
  );

  assert.deepEqual(calls, [
    {
      amount: 1000,
      currency: "eur",
      metadata: { proposalId: "proposal_123" }
    }
  ]);
});

test("createStripePaymentIntent rejects missing or invalid amount", async () => {
  const stripe = {
    paymentIntents: {
      async create() {
        throw new Error("should not call Stripe for invalid payloads");
      }
    }
  };

  await assert.rejects(
    () => createStripePaymentIntent({ amount: 0 }, stripe),
    (error) =>
      error instanceof PaymentServiceError &&
      error.statusCode === 400 &&
      error.message.includes("positive integer")
  );

  await assert.rejects(
    () => createStripePaymentIntent({ amount: 12.5 }, stripe),
    (error) =>
      error instanceof PaymentServiceError &&
      error.statusCode === 400 &&
      error.message.includes("positive integer")
  );
});

test("createStripePaymentIntent rethrows Stripe errors with the original message", async () => {
  const stripe = {
    paymentIntents: {
      async create() {
        const error = new Error("Invalid API key provided");
        error.type = "StripeAuthenticationError";
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createStripePaymentIntent({ amount: 1000 }, stripe),
    (error) =>
      error instanceof PaymentServiceError &&
      error.statusCode === 502 &&
      error.message.includes("Invalid API key provided")
  );
});

test("createPaymentIntent creates a test-mode PaymentIntent when explicitly enabled", async (t) => {
  if (process.env.RUN_STRIPE_INTEGRATION_TEST !== "true" || !process.env.STRIPE_SECRET_KEY) {
    t.skip("Set RUN_STRIPE_INTEGRATION_TEST=true and STRIPE_SECRET_KEY to run Stripe smoke test");
    return;
  }

  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { source: "api-smoke-test" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
});
