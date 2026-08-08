import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

function createStripeMock(responseOrError, calls = []) {
  return {
    paymentIntents: {
      async create(params) {
        calls.push(params);
        if (responseOrError instanceof Error) {
          throw responseOrError;
        }
        return responseOrError;
      }
    }
  };
}

test("createPaymentIntent creates a Stripe PaymentIntent with validated arguments", async () => {
  const calls = [];
  const stripeClient = createStripeMock(
    {
      id: "pi_mocked",
      client_secret: "pi_mocked_secret",
      amount: 2500,
      currency: "usd"
    },
    calls
  );

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: { jobId: "job_123", clientId: "usr_123" }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: { jobId: "job_123", clientId: "usr_123" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_mocked",
    clientSecret: "pi_mocked_secret",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];
  const stripeClient = createStripeMock(
    {
      id: "pi_default_currency",
      client_secret: "pi_default_currency_secret"
    },
    calls
  );

  const result = await createPaymentIntent({ amount: 1200 }, { stripeClient });

  assert.equal(calls[0].currency, "usd");
  assert.equal(result.currency, "usd");
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  const calls = [];
  const stripeClient = createStripeMock({ id: "pi_should_not_exist" }, calls);

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    /amount must be a positive integer/
  );

  assert.equal(calls.length, 0);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = new Error("Your card was declined");
  stripeError.type = "StripeCardError";

  await assert.rejects(
    () => createPaymentIntent({ amount: 1500, currency: "usd" }, { stripeClient: createStripeMock(stripeError) }),
    /Your card was declined/
  );
});

test(
  "createPaymentIntent can create a real Stripe test-mode PaymentIntent",
  {
    skip:
      process.env.RUN_STRIPE_SMOKE_TEST === "1" && process.env.STRIPE_SECRET_KEY
        ? false
        : "Set RUN_STRIPE_SMOKE_TEST=1 and STRIPE_SECRET_KEY to run"
  },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { source: "api-smoke-test" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
  }
);
