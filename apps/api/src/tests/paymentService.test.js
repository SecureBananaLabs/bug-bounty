import test from "node:test";
import assert from "node:assert/strict";
import { buildPaymentIntentParams, createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

test("createPaymentIntent calls Stripe with validated payment intent params", async () => {
  const calls = [];
  const stripeClient = {
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
  };

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: {
        orderId: "order_123",
        attempt: 1
      }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        orderId: "order_123",
        attempt: "1"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("buildPaymentIntentParams defaults currency to usd", () => {
  assert.deepEqual(buildPaymentIntentParams({ amount: 1000 }), {
    amount: 1000,
    currency: "usd"
  });
});

test("buildPaymentIntentParams rejects invalid amount values", () => {
  assert.throws(
    () => buildPaymentIntentParams({ amount: 0 }),
    /payload.amount must be a positive integer/
  );
  assert.throws(
    () => buildPaymentIntentParams({ amount: 10.5 }),
    /payload.amount must be a positive integer/
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
    createPaymentIntent({ amount: 1000 }, { stripeClient }),
    (error) => {
      assert.ok(error instanceof PaymentServiceError);
      assert.equal(error.statusCode, 502);
      assert.match(error.message, /Your card was declined/);
      return true;
    }
  );
});
