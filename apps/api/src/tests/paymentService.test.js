import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

function createMockStripeClient(paymentIntent = { id: "pi_mock_123", client_secret: "pi_mock_123_secret_mock" }) {
  const calls = [];

  return {
    calls,
    client: {
      paymentIntents: {
        create: async (params) => {
          calls.push(params);
          return paymentIntent;
        }
      }
    }
  };
}

test("createPaymentIntent creates a Stripe PaymentIntent with default currency", async () => {
  const { calls, client } = createMockStripeClient();

  const result = await createPaymentIntent({ amount: 1299 }, { stripeClient: client });

  assert.deepEqual(calls, [{ amount: 1299, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_mock_123",
    clientSecret: "pi_mock_123_secret_mock",
    amount: 1299,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent normalizes currency and metadata before calling Stripe", async () => {
  const { calls, client } = createMockStripeClient();

  await createPaymentIntent(
    {
      amount: 2500,
      currency: "EUR",
      metadata: {
        orderId: 42,
        customer: "demo",
        recurring: false
      }
    },
    { stripeClient: client }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "eur",
      metadata: {
        orderId: "42",
        customer: "demo",
        recurring: "false"
      }
    }
  ]);
});

test("createPaymentIntent rejects missing or invalid amounts before Stripe is called", async () => {
  const { calls, client } = createMockStripeClient();

  await assert.rejects(
    () => createPaymentIntent({ amount: 12.5 }, { stripeClient: client }),
    (error) => {
      assert.ok(error instanceof PaymentServiceError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /positive integer/);
      return true;
    }
  );

  await assert.rejects(
    () => createPaymentIntent({}, { stripeClient: client }),
    (error) => {
      assert.ok(error instanceof PaymentServiceError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /positive integer/);
      return true;
    }
  );

  assert.deepEqual(calls, []);
});

test("createPaymentIntent preserves original Stripe error messages", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.statusCode = 402;
  const client = {
    paymentIntents: {
      create: async () => {
        throw stripeError;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripeClient: client }),
    (error) => {
      assert.ok(error instanceof PaymentServiceError);
      assert.equal(error.statusCode, 402);
      assert.equal(error.message, "Your card was declined.");
      return true;
    }
  );
});

test(
  "guarded smoke creates a test-mode Stripe PaymentIntent",
  {
    skip:
      process.env.RUN_STRIPE_PAYMENT_SMOKE === "1" && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
        ? false
        : "Set RUN_STRIPE_PAYMENT_SMOKE=1 with a sk_test STRIPE_SECRET_KEY to run"
  },
  async () => {
    const result = await createPaymentIntent({
      amount: 123,
      currency: "usd",
      metadata: { source: "payment-service-smoke-test" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
    assert.equal(result.amount, 123);
    assert.equal(result.currency, "usd");
  }
);
