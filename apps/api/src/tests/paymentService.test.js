import test, { mock } from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  createPaymentIntentWithClient
} from "../services/paymentService.js";

test("createPaymentIntentWithClient creates a Stripe PaymentIntent with validated arguments", async () => {
  const create = mock.fn(async (args) => ({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_456",
    amount: args.amount,
    currency: args.currency
  }));
  const stripe = {
    paymentIntents: {
      create
    }
  };

  const result = await createPaymentIntentWithClient(
    {
      amount: 2599,
      currency: "USD",
      metadata: {
        jobId: "job_123",
        clientId: "user_456"
      }
    },
    stripe
  );

  assert.equal(create.mock.callCount(), 1);
  assert.deepEqual(create.mock.calls[0].arguments[0], {
    amount: 2599,
    currency: "usd",
    metadata: {
      jobId: "job_123",
      clientId: "user_456"
    }
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2599,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntentWithClient defaults currency to usd", async () => {
  const create = mock.fn(async (args) => ({
    id: "pi_default_currency",
    client_secret: "pi_default_currency_secret",
    amount: args.amount,
    currency: args.currency
  }));

  await createPaymentIntentWithClient(
    { amount: 500 },
    { paymentIntents: { create } }
  );

  assert.equal(create.mock.calls[0].arguments[0].currency, "usd");
});

test("createPaymentIntentWithClient rejects invalid amounts before calling Stripe", async () => {
  const create = mock.fn();

  await assert.rejects(
    () =>
      createPaymentIntentWithClient(
        { amount: 0 },
        { paymentIntents: { create } }
      ),
    /positive integer/
  );
  assert.equal(create.mock.callCount(), 0);
});

test("createPaymentIntentWithClient preserves Stripe error messages", async () => {
  const create = mock.fn(async () => {
    const error = new Error("Your card was declined");
    error.type = "StripeCardError";
    throw error;
  });

  await assert.rejects(
    () =>
      createPaymentIntentWithClient(
        { amount: 1000, currency: "usd" },
        { paymentIntents: { create } }
      ),
    /Your card was declined/
  );
});

test("createPaymentIntent creates a real Stripe PaymentIntent when smoke test env is enabled", {
  skip:
    process.env.RUN_STRIPE_SMOKE_TEST === "true" && process.env.STRIPE_SECRET_KEY
      ? false
      : "Set RUN_STRIPE_SMOKE_TEST=true and STRIPE_SECRET_KEY to run Stripe smoke test"
}, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      smokeTest: "true"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
});
