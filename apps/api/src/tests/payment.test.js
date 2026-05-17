import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

// ---------------------------------------------------------------------------
// Unit tests — inject a mock Stripe client so no network call is made
// ---------------------------------------------------------------------------

test("createPaymentIntent: returns expected shape on successful call", async () => {
  const mockStripe = {
    paymentIntents: {
      create: async () => ({
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_abc",
        amount: 5000,
        currency: "usd",
      }),
    },
  };

  const result = await createPaymentIntent(
    { amount: 5000, currency: "usd" },
    mockStripe
  );

  assert.equal(result.paymentId, "pi_test_123");
  assert.equal(result.clientSecret, "pi_test_123_secret_abc");
  assert.equal(result.amount, 5000);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});

test("createPaymentIntent: passes correct amount and currency to Stripe", async () => {
  let capturedArgs = null;

  const mockStripe = {
    paymentIntents: {
      create: async (args) => {
        capturedArgs = args;
        return {
          id: "pi_test_456",
          client_secret: "secret_456",
          amount: args.amount,
          currency: args.currency,
        };
      },
    },
  };

  await createPaymentIntent({ amount: 2999, currency: "jpy" }, mockStripe);
  assert.deepEqual(capturedArgs, { amount: 2999, currency: "jpy" });
});

test("createPaymentIntent: defaults currency to usd when not provided", async () => {
  let capturedArgs = null;

  const mockStripe = {
    paymentIntents: {
      create: async (args) => {
        capturedArgs = args;
        return {
          id: "pi_test_def",
          client_secret: "secret_def",
          amount: args.amount,
          currency: args.currency,
        };
      },
    },
  };

  await createPaymentIntent({ amount: 1000 }, mockStripe);
  assert.equal(capturedArgs.currency, "usd");
});

test("createPaymentIntent: throws on invalid amount (not a number)", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: "not-a-number", currency: "usd" }),
    { message: /Invalid amount/ }
  );
});

test("createPaymentIntent: throws on invalid amount (zero)", async () => {
  await assert.rejects(() => createPaymentIntent({ amount: 0, currency: "usd" }), {
    message: /Invalid amount/,
  });
});

test("createPaymentIntent: throws on invalid amount (negative)", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: -100, currency: "usd" }),
    { message: /Invalid amount/ }
  );
});

test("createPaymentIntent: throws on invalid amount (float)", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 10.99, currency: "usd" }),
    { message: /Invalid amount/ }
  );
});

test("createPaymentIntent: throws on missing payload", async () => {
  await assert.rejects(() => createPaymentIntent(undefined), {
    message: /Invalid amount/,
  });
});

test("createPaymentIntent: wraps Stripe errors with type prefix", async () => {
  const mockStripe = {
    paymentIntents: {
      create: async () => {
        const err = new Error("invalid API key");
        err.type = "StripeInvalidRequestError";
        throw err;
      },
    },
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usd" }, mockStripe),
    {
      message:
        /Stripe error \(StripeInvalidRequestError\): invalid API key/,
    }
  );
});

// ---------------------------------------------------------------------------
// Integration / smoke test — only runs when STRIPE_SECRET_KEY is set
// ---------------------------------------------------------------------------

test("createPaymentIntent: integration — real Stripe test-mode call", {
  skip: !process.env.STRIPE_SECRET_KEY,
}, async () => {
  const result = await createPaymentIntent({ amount: 50, currency: "usd" });

  assert.ok(result.paymentId, "paymentId should be present");
  assert.ok(
    result.paymentId.startsWith("pi_"),
    "paymentId should start with pi_"
  );
  assert.ok(result.clientSecret, "clientSecret should be present");
  assert.ok(
    result.clientSecret.startsWith("pi_"),
    "clientSecret should start with pi_"
  );
  assert.equal(result.amount, 50);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
