import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent creates a Stripe PaymentIntent and maps the response", async () => {
  let receivedParams;

  const stripeClient = {
    paymentIntents: {
      create: async (params) => {
        receivedParams = params;

        return {
          id: "pi_123",
          client_secret: "pi_123_secret_456",
          amount: params.amount,
          currency: params.currency
        };
      }
    }
  };

  const result = await createPaymentIntent(
    {
      amount: 1099,
      currency: "USD",
      metadata: {
        jobId: 42,
        expedited: true
      }
    },
    { stripeClient }
  );

  assert.deepEqual(receivedParams, {
    amount: 1099,
    currency: "usd",
    metadata: {
      jobId: "42",
      expedited: "true"
    }
  });

  assert.deepEqual(result, {
    paymentId: "pi_123",
    clientSecret: "pi_123_secret_456",
    amount: 1099,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 10.5 }, { stripeClient: { paymentIntents: {} } }),
    /Payment amount must be a positive integer in the smallest currency unit\./
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = Object.assign(new Error("Your card was declined."), {
    type: "StripeCardError"
  });

  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw stripeError;
      }
    }
  };

  await assert.rejects(
    createPaymentIntent({ amount: 2500 }, { stripeClient }),
    /Your card was declined\./
  );
});
