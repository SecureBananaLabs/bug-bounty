import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, setStripeClient } from "../services/paymentService.js";

test.afterEach(() => {
  setStripeClient(undefined);
});

test("createPaymentIntent validates amount", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 0 }),
    /amount must be a positive integer/
  );

  await assert.rejects(
    createPaymentIntent({ amount: 12.5 }),
    /amount must be a positive integer/
  );
});

test("createPaymentIntent validates currency", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 1000, currency: "usdollar" }),
    /currency must be a three-letter ISO currency code/
  );
});

test("createPaymentIntent creates Stripe PaymentIntent with defaults", async () => {
  const calls = [];
  setStripeClient({
    paymentIntents: {
      async create(payload) {
        calls.push(payload);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456",
          amount: payload.amount,
          currency: payload.currency
        };
      }
    }
  });

  const result = await createPaymentIntent({ amount: 1500 });

  assert.deepEqual(calls, [{ amount: 1500, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 1500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent passes currency and metadata", async () => {
  const calls = [];
  setStripeClient({
    paymentIntents: {
      async create(payload) {
        calls.push(payload);
        return {
          id: "pi_test_456",
          client_secret: "secret",
          amount: payload.amount,
          currency: payload.currency
        };
      }
    }
  });

  await createPaymentIntent({
    amount: 2500,
    currency: "EUR",
    metadata: { orderId: "order_1" }
  });

  assert.deepEqual(calls, [
    { amount: 2500, currency: "eur", metadata: { orderId: "order_1" } }
  ]);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  setStripeClient({
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined");
        error.type = "StripeCardError";
        throw error;
      }
    }
  });

  await assert.rejects(
    createPaymentIntent({ amount: 1500 }),
    /Your card was declined/
  );
});

test("createPaymentIntent live Stripe smoke test", { skip: process.env.RUN_STRIPE_SMOKE !== "1" }, async () => {
  setStripeClient(undefined);
  const result = await createPaymentIntent({ amount: 100, currency: "usd" });
  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
});
