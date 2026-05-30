import test from "node:test";
import assert from "node:assert/strict";
import {
  clearStripeClientForTest,
  createPaymentIntent,
  setStripeClientForTest
} from "../services/paymentService.js";

test.afterEach(() => {
  clearStripeClientForTest();
});

test("createPaymentIntent validates amount before calling Stripe", async () => {
  let called = false;
  setStripeClientForTest({
    paymentIntents: {
      create: async () => {
        called = true;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0, currency: "usd" }),
    /positive integer/
  );
  assert.equal(called, false);
});

test("createPaymentIntent defaults currency and maps Stripe response", async () => {
  const calls = [];
  setStripeClientForTest({
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        return {
          id: "pi_benchmark_123",
          client_secret: "pi_benchmark_123_secret_456"
        };
      }
    }
  });

  const result = await createPaymentIntent({
    amount: 2500,
    metadata: {
      jobId: "job_123",
      milestone: 2,
      expedited: false,
      note: null
    }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        milestone: "2",
        expedited: "false",
        note: ""
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_benchmark_123",
    clientSecret: "pi_benchmark_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent normalizes explicit currency", async () => {
  const calls = [];
  setStripeClientForTest({
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        return {
          id: "pi_currency_123",
          client_secret: "pi_currency_123_secret"
        };
      }
    }
  });

  await createPaymentIntent({ amount: 5000, currency: "INR" });

  assert.equal(calls[0].currency, "inr");
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  setStripeClientForTest({
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined");
        error.type = "StripeCardError";
        throw error;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 2500, currency: "usd" }),
    /Your card was declined/
  );
});
