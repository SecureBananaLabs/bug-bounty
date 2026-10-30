import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

function fakeStripe(captured, impl) {
  return {
    paymentIntents: {
      create: async (params) => {
        captured.params = params;
        return impl(params);
      }
    }
  };
}

function okIntent(params) {
  return {
    id: "pi_test_123",
    amount: params.amount,
    currency: params.currency,
    client_secret: "pi_test_123_secret_abc"
  };
}

test("rejects when amount is missing", async () => {
  const client = fakeStripe({}, okIntent);
  await assert.rejects(
    () => createPaymentIntent({}, { stripeClient: client }),
    /amount is required/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: null }, { stripeClient: client }),
    /amount is required/
  );
  await assert.rejects(
    () => createPaymentIntent(undefined, { stripeClient: client }),
    /amount is required/
  );
});

test("rejects non-positive-integer amounts", async () => {
  for (const bad of [0, -100, 99.99, "5000", NaN]) {
    const client = fakeStripe({}, okIntent);
    await assert.rejects(
      () => createPaymentIntent({ amount: bad }, { stripeClient: client }),
      /must be a positive integer/,
      `amount ${String(bad)} should be rejected`
    );
  }
});

test("creates intent with usd default and returns client secret", async () => {
  const captured = {};
  const result = await createPaymentIntent(
    { amount: 5000 },
    { stripeClient: fakeStripe(captured, okIntent) }
  );

  assert.deepEqual(captured.params, {
    amount: 5000,
    currency: "usd",
    metadata: {}
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    amount: 5000,
    currency: "usd",
    clientSecret: "pi_test_123_secret_abc",
    provider: "stripe"
  });
});

test("passes currency through lowercased with metadata", async () => {
  const captured = {};
  const result = await createPaymentIntent(
    { amount: 250, currency: "EUR", metadata: { orderId: "o1" } },
    { stripeClient: fakeStripe(captured, okIntent) }
  );

  assert.equal(captured.params.currency, "eur");
  assert.deepEqual(captured.params.metadata, { orderId: "o1" });
  assert.equal(result.currency, "eur");
});

test("rejects with a clear message when STRIPE_SECRET_KEY is missing", async () => {
  const saved = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  try {
    await assert.rejects(
      () => createPaymentIntent({ amount: 100 }),
      /set the STRIPE_SECRET_KEY environment variable/
    );
  } finally {
    if (saved !== undefined) process.env.STRIPE_SECRET_KEY = saved;
  }
});

test("wraps Stripe API errors with a meaningful message", async () => {
  const failing = {
    paymentIntents: {
      create: async () => {
        const error = new Error("Invalid API Key provided");
        error.code = "api_key_expired";
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 100 }, { stripeClient: failing }),
    /Stripe payment intent creation failed \[api_key_expired\]: Invalid API Key provided/
  );
});
