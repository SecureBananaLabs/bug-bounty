import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../config/env.js";
import { createPaymentIntent } from "../services/paymentService.js";

function stripeClient(response, calls = []) {
  return {
    paymentIntents: {
      async create(payload) {
        calls.push(payload);
        if (response instanceof Error) {
          throw response;
        }
        return response;
      }
    }
  };
}

test("createPaymentIntent returns client-safe Stripe fields", async () => {
  const calls = [];
  const result = await createPaymentIntent(
    {
      amount: 1250,
      currency: "USD",
      metadata: { orderId: 123, empty: null }
    },
    stripeClient(
      {
        id: "pi_123",
        client_secret: "pi_123_secret_abc",
        amount: 1250,
        currency: "usd",
        status: "requires_payment_method"
      },
      calls
    )
  );

  assert.deepEqual(calls, [
    {
      amount: 1250,
      currency: "usd",
      metadata: { orderId: "123" },
      automatic_payment_methods: { enabled: true }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_123",
    clientSecret: "pi_123_secret_abc",
    amount: 1250,
    currency: "usd",
    status: "requires_payment_method",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects invalid amount before calling Stripe", async () => {
  const calls = [];

  await assert.rejects(
    () => createPaymentIntent({ amount: 49 }, stripeClient({}, calls)),
    /Payment amount must be an integer/
  );

  assert.equal(calls.length, 0);
});

test("createPaymentIntent rejects invalid currency before calling Stripe", async () => {
  const calls = [];

  await assert.rejects(
    () => createPaymentIntent({ amount: 500, currency: "usdt" }, stripeClient({}, calls)),
    /Currency must be a three-letter ISO currency code/
  );

  assert.equal(calls.length, 0);
});

test("createPaymentIntent sanitizes Stripe provider errors", async () => {
  await assert.rejects(
    () =>
      createPaymentIntent(
        { amount: 500 },
        stripeClient(new Error("card_declined: sensitive provider detail"))
      ),
    /^Error: Failed to create payment intent$/
  );
});

test("createPaymentIntent preserves missing secret configuration errors", async () => {
  const previousSecret = env.stripeSecretKey;
  env.stripeSecretKey = "";

  await assert.rejects(
    () => createPaymentIntent({ amount: 500 }),
    /STRIPE_SECRET_KEY is not configured/
  );

  env.stripeSecretKey = previousSecret;
});
