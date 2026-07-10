import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  __setStripeClientForTesting
} from "../services/paymentService.js";

function mockStripeClient(createImpl) {
  return {
    paymentIntents: {
      create: createImpl
    }
  };
}

test("createPaymentIntent calls stripe.paymentIntents.create with expected args", async () => {
  let receivedArgs;
  __setStripeClientForTesting(
    mockStripeClient(async (args) => {
      receivedArgs = args;
      return {
        id: "pi_test_123",
        client_secret: "secret_test_123",
        amount: args.amount,
        currency: args.currency
      };
    })
  );

  const result = await createPaymentIntent({ amount: 5000, currency: "eur" });

  assert.deepEqual(receivedArgs, { amount: 5000, currency: "eur" });
  assert.equal(result.clientSecret, "secret_test_123");
  assert.equal(result.paymentId, "pi_test_123");
  assert.equal(result.provider, "stripe");
});

test("createPaymentIntent defaults currency to usd", async () => {
  let receivedArgs;
  __setStripeClientForTesting(
    mockStripeClient(async (args) => {
      receivedArgs = args;
      return {
        id: "pi_test_456",
        client_secret: "secret_test_456",
        amount: args.amount,
        currency: args.currency
      };
    })
  );

  await createPaymentIntent({ amount: 1000 });

  assert.equal(receivedArgs.currency, "usd");
});

test("createPaymentIntent rejects when amount is missing", async () => {
  __setStripeClientForTesting(mockStripeClient(async () => ({})));

  await assert.rejects(
    () => createPaymentIntent({}),
    /payload.amount is required/
  );
});

test("createPaymentIntent rejects when amount is not a positive integer", async () => {
  __setStripeClientForTesting(mockStripeClient(async () => ({})));

  await assert.rejects(
    () => createPaymentIntent({ amount: -5 }),
    /positive integer/
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }),
    /positive integer/
  );
});

test("createPaymentIntent surfaces Stripe API errors with original message", async () => {
  __setStripeClientForTesting(
    mockStripeClient(async () => {
      const error = new Error("Your card was declined.");
      error.type = "StripeCardError";
      throw error;
    })
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 2000 }),
    /Your card was declined\./
  );
});
