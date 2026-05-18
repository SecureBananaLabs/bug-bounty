import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, initStripe } from "../services/paymentService.js";

test.afterEach(() => {
  initStripe(null);
  delete process.env.STRIPE_SECRET_KEY;
});

test("createPaymentIntent validates required positive integer amount", async () => {
  await assert.rejects(() => createPaymentIntent({ currency: "usd" }), /amount must be a positive integer/);
  await assert.rejects(() => createPaymentIntent({ amount: 10.5 }), /amount must be a positive integer/);
  await assert.rejects(() => createPaymentIntent({ amount: -1 }), /amount must be a positive integer/);
});

test("createPaymentIntent creates Stripe PaymentIntent with default currency", async () => {
  const calls = [];
  initStripe({
    paymentIntents: {
      create: async (params) => {
        calls.push(params);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456",
          amount: params.amount,
          currency: params.currency
        };
      }
    }
  });

  const result = await createPaymentIntent({ amount: 2500 });

  assert.deepEqual(calls, [{ amount: 2500, currency: "usd", metadata: {} }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent preserves metadata and Stripe error messages", async () => {
  initStripe({
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined");
        error.type = "StripeCardError";
        throw error;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1200, currency: "EUR", metadata: { jobId: "job_123" } }),
    /Your card was declined/
  );
});

test("guarded Stripe smoke test only runs when explicitly enabled", async (t) => {
  if (process.env.RUN_STRIPE_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY) {
    t.skip("Set RUN_STRIPE_SMOKE=1 with STRIPE_SECRET_KEY to run live Stripe smoke test");
    return;
  }

  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.ok(result.clientSecret);
});
