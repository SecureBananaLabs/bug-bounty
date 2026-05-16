import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent creates a Stripe PaymentIntent and returns client details", async () => {
  const createCalls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (params) => {
        createCalls.push(params);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc"
        };
      }
    }
  };

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: {
        jobId: "job_123",
        proposalId: 42,
        ignored: null
      }
    },
    { stripeClient }
  );

  assert.deepEqual(createCalls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        proposalId: "42"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent validates amount and currency before calling Stripe", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw new Error("Stripe should not be called for invalid input");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0, currency: "usd" }, { stripeClient }),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usdollar" }, { stripeClient }),
    /three-letter ISO currency code/
  );
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined");
        error.raw = { message: "Stripe says this payment method is unavailable" };
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1500, currency: "usd" }, { stripeClient }),
    /Stripe says this payment method is unavailable/
  );
});
