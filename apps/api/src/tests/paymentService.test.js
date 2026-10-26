import test from "node:test";
import assert from "node:assert/strict";
import {
  __resetStripeClientForTest,
  __setStripeClientForTest,
  createPaymentIntent
} from "../services/paymentService.js";

function createStripeMock(response, error) {
  const calls = [];

  return {
    calls,
    client: {
      paymentIntents: {
        create: async (payload) => {
          calls.push(payload);

          if (error) {
            throw error;
          }

          return response;
        }
      }
    }
  };
}

test.afterEach(() => {
  __resetStripeClientForTest();
  delete process.env.STRIPE_SECRET_KEY;
});

test("createPaymentIntent creates a Stripe payment intent with default currency", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const stripe = createStripeMock({
    id: "pi_mocked",
    client_secret: "pi_mocked_secret",
    amount: 2500,
    currency: "usd"
  });
  __setStripeClientForTest(stripe.client);

  const result = await createPaymentIntent({ amount: 2500 });

  assert.deepEqual(stripe.calls, [{ amount: 2500, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_mocked",
    clientSecret: "pi_mocked_secret",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent passes currency and metadata to Stripe", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const stripe = createStripeMock({
    id: "pi_metadata",
    client_secret: "pi_metadata_secret",
    amount: 1200,
    currency: "eur"
  });
  __setStripeClientForTest(stripe.client);

  await createPaymentIntent({
    amount: 1200,
    currency: "eur",
    metadata: { jobId: "job_123" }
  });

  assert.deepEqual(stripe.calls, [
    {
      amount: 1200,
      currency: "eur",
      metadata: { jobId: "job_123" }
    }
  ]);
});

test("createPaymentIntent rejects missing or invalid amounts before calling Stripe", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const stripe = createStripeMock({});
  __setStripeClientForTest(stripe.client);

  await assert.rejects(() => createPaymentIntent({}), /positive integer/);
  await assert.rejects(() => createPaymentIntent({ amount: 0 }), /positive integer/);
  await assert.rejects(() => createPaymentIntent({ amount: 12.5 }), /positive integer/);

  assert.deepEqual(stripe.calls, []);
});

test("createPaymentIntent requires a Stripe secret key", async () => {
  const stripe = createStripeMock({});
  __setStripeClientForTest(stripe.client);

  await assert.rejects(
    () => createPaymentIntent({ amount: 2500 }),
    /STRIPE_SECRET_KEY environment variable is required/
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const stripeError = new Error("Your card was declined");
  stripeError.type = "StripeCardError";
  const stripe = createStripeMock(null, stripeError);
  __setStripeClientForTest(stripe.client);

  await assert.rejects(
    () => createPaymentIntent({ amount: 2500 }),
    /Stripe payment intent failed: Your card was declined/
  );
});

test("createPaymentIntent can create a real test-mode Stripe payment intent", { skip: !process.env.RUN_STRIPE_SMOKE_TEST }, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smokeTest: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
