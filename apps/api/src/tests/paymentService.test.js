import test from "node:test";
import assert from "node:assert/strict";

process.env.STRIPE_SECRET_KEY = "sk_test_unit";

const { createPaymentIntent, setStripeClientFactory } = await import("../services/paymentService.js");

let createArgs;
setStripeClientFactory((secretKey) => {
  assert.equal(secretKey, "sk_test_unit");
  return {
    paymentIntents: {
      create: async (args) => {
        createArgs = args;
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456",
          amount: args.amount,
          currency: args.currency
        };
      }
    }
  };
});

test("createPaymentIntent creates a Stripe PaymentIntent and maps identifiers", async () => {
  const result = await createPaymentIntent({ amount: 2500, currency: "USD" });
  assert.deepEqual(createArgs, { amount: 2500, currency: "usd", metadata: {} });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent validates amount", async () => {
  await assert.rejects(() => createPaymentIntent({ amount: 0 }), /positive integer/);
});

test("createPaymentIntent defaults currency to usd", async () => {
  await createPaymentIntent({ amount: 100 });
  assert.equal(createArgs.currency, "usd");
});
