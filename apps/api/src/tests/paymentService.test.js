import test, { mock } from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  PaymentProviderError,
  PaymentValidationError
} from "../services/paymentService.js";

test("createPaymentIntent creates a Stripe PaymentIntent with validated fields", async () => {
  const create = mock.fn(async (paymentIntentPayload) => ({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_abc",
    amount: paymentIntentPayload.amount,
    currency: paymentIntentPayload.currency
  }));

  const stripeClient = {
    paymentIntents: { create }
  };

  const result = await createPaymentIntent(
    {
      amount: 1250,
      currency: "USD",
      metadata: {
        jobId: "job_123",
        milestone: 2,
        escrow: true
      }
    },
    { stripeClient }
  );

  assert.equal(create.mock.callCount(), 1);
  assert.deepEqual(create.mock.calls[0].arguments[0], {
    amount: 1250,
    currency: "usd",
    metadata: {
      jobId: "job_123",
      milestone: "2",
      escrow: "true"
    }
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 1250,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const create = mock.fn(async (paymentIntentPayload) => ({
    id: "pi_test_default_currency",
    client_secret: "pi_test_default_currency_secret",
    amount: paymentIntentPayload.amount,
    currency: paymentIntentPayload.currency
  }));

  await createPaymentIntent(
    { amount: 500 },
    { stripeClient: { paymentIntents: { create } } }
  );

  assert.deepEqual(create.mock.calls[0].arguments[0], {
    amount: 500,
    currency: "usd"
  });
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  const create = mock.fn();

  await assert.rejects(
    createPaymentIntent(
      { amount: 12.5 },
      { stripeClient: { paymentIntents: { create } } }
    ),
    PaymentValidationError
  );

  assert.equal(create.mock.callCount(), 0);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.type = "StripeCardError";
  stripeError.statusCode = 402;

  const create = mock.fn(async () => {
    throw stripeError;
  });

  await assert.rejects(
    createPaymentIntent(
      { amount: 500, currency: "usd" },
      { stripeClient: { paymentIntents: { create } } }
    ),
    (error) => {
      assert.ok(error instanceof PaymentProviderError);
      assert.equal(error.message, "Your card was declined.");
      assert.equal(error.statusCode, 402);
      assert.equal(error.cause, stripeError);
      return true;
    }
  );
});

test(
  "createPaymentIntent can create a test-mode Stripe PaymentIntent",
  {
    skip:
      process.env.RUN_STRIPE_SMOKE_TEST !== "true"
        ? "set RUN_STRIPE_SMOKE_TEST=true to run this live Stripe smoke test"
        : !process.env.STRIPE_SECRET_KEY
          ? "set STRIPE_SECRET_KEY to run this live Stripe smoke test"
          : false
  },
  async () => {
    const result = await createPaymentIntent({
      amount: 50,
      currency: "usd",
      metadata: { test: "payment-service-smoke" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
  }
);
