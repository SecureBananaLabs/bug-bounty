import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, __test__ } from "../services/paymentService.js";

test("createPaymentIntent creates a Stripe PaymentIntent with validated defaults", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (params) => {
        calls.push(params);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc",
          amount: params.amount,
          currency: params.currency
        };
      }
    }
  };

  const result = await createPaymentIntent(
    { amount: 2500, metadata: { invoiceId: "inv_001" } },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: { invoiceId: "inv_001" }
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

test("createPaymentIntent validates amount before calling Stripe", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw new Error("Stripe should not be called");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    /positive integer/
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 5000, currency: "mxn" }, { stripeClient }),
    /Your card was declined/
  );
});

test("validatePaymentPayload normalizes currency", () => {
  assert.deepEqual(__test__.validatePaymentPayload({ amount: 100, currency: "MXN" }), {
    amount: 100,
    currency: "mxn",
    metadata: undefined
  });
});
