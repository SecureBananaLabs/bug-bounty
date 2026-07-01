import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  PaymentProviderError,
  PaymentValidationError
} from "../services/paymentService.js";

test("createPaymentIntent creates Stripe PaymentIntent with validated defaults", async () => {
  const calls = [];
  const stripe = fakeStripeClient(calls, {
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_abc"
  });

  const result = await createPaymentIntent({ amount: 2500 }, stripe);

  assert.deepEqual(calls, [{ amount: 2500, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent lowercases currency and stringifies metadata", async () => {
  const calls = [];
  const stripe = fakeStripeClient(calls, {
    id: "pi_test_meta",
    client_secret: "pi_test_meta_secret"
  });

  await createPaymentIntent({
    amount: 1200,
    currency: "EUR",
    metadata: {
      jobId: "job_123",
      installment: 2,
      escrow: true
    }
  }, stripe);

  assert.deepEqual(calls, [{
    amount: 1200,
    currency: "eur",
    metadata: {
      jobId: "job_123",
      installment: "2",
      escrow: "true"
    }
  }]);
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  const invalidAmounts = [undefined, null, 0, -1, 10.5, "2500"];

  for (const amount of invalidAmounts) {
    await assert.rejects(
      () => createPaymentIntent({ amount }, fakeStripeClient([])),
      PaymentValidationError
    );
  }
});

test("createPaymentIntent rejects invalid currency and metadata", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usdollars" }, fakeStripeClient([])),
    PaymentValidationError
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: ["job_123"] }, fakeStripeClient([])),
    PaymentValidationError
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: { nested: { jobId: "job_123" } } }, fakeStripeClient([])),
    PaymentValidationError
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripe = {
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 2500 }, stripe),
    (error) => error instanceof PaymentProviderError && error.message === "Your card was declined."
  );
});

test("live Stripe smoke creates a test PaymentIntent when explicitly enabled", {
  skip: process.env.RUN_STRIPE_PAYMENT_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY
}, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { source: "api-smoke-test" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
});

function fakeStripeClient(calls, response = { id: "pi_test", client_secret: "pi_test_secret" }) {
  return {
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        return response;
      }
    }
  };
}
