import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent validates payload and creates a Stripe PaymentIntent", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (args) => {
        calls.push(args);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_secret_123"
        };
      }
    }
  };

  const result = await createPaymentIntent(
    { amount: 1999, currency: "eur", metadata: { orderId: "order_123" } },
    stripeClient
  );

  assert.deepEqual(calls, [
    { amount: 1999, currency: "eur", metadata: { orderId: "order_123" } }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_secret_123",
    amount: 1999,
    currency: "eur",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (args) => {
        calls.push(args);
        return {
          id: "pi_default_currency",
          client_secret: "pi_default_currency_secret"
        };
      }
    }
  };

  const result = await createPaymentIntent({ amount: 500 }, stripeClient);

  assert.deepEqual(calls, [{ amount: 500, currency: "usd" }]);
  assert.equal(result.currency, "usd");
});

test("createPaymentIntent rejects missing or invalid amounts before calling Stripe", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw new Error("Stripe should not be called for invalid input");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({}, stripeClient),
    /amount is required and must be a positive integer/i
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, stripeClient),
    /amount is required and must be a positive integer/i
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 12.34 }, stripeClient),
    /amount is required and must be a positive integer/i
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined");
        error.type = "StripeCardError";
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 500 }, stripeClient),
    /Your card was declined/
  );
});

test("createPaymentIntent smoke test can create a real test-mode Stripe PaymentIntent", { skip: process.env.STRIPE_PAYMENT_SMOKE_TEST !== "1" }, async () => {
  const result = await createPaymentIntent({ amount: 100, currency: "usd", metadata: { smoke: "true" } });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
});
