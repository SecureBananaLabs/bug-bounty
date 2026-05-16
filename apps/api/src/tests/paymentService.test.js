import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  resetStripeClientForTests
} from "../services/paymentService.js";

function createMockStripeClient({ response, error } = {}) {
  const calls = [];

  return {
    calls,
    client: {
      paymentIntents: {
        create: async (params) => {
          calls.push(params);

          if (error) {
            throw error;
          }

          return (
            response ?? {
              id: "pi_mock_123",
              client_secret: "pi_mock_123_secret_mock"
            }
          );
        }
      }
    }
  };
}

test("createPaymentIntent validates payload and maps Stripe PaymentIntent response", async () => {
  const stripe = createMockStripeClient();

  const result = await createPaymentIntent(
    {
      amount: 2499,
      currency: "USD",
      metadata: {
        checkoutId: "checkout_123",
        userId: 42,
        recurring: false
      }
    },
    { stripeClient: stripe.client }
  );

  assert.deepEqual(stripe.calls, [
    {
      amount: 2499,
      currency: "usd",
      metadata: {
        checkoutId: "checkout_123",
        userId: "42",
        recurring: "false"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_mock_123",
    clientSecret: "pi_mock_123_secret_mock",
    amount: 2499,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd and omits metadata when not provided", async () => {
  const stripe = createMockStripeClient({
    response: {
      id: "pi_without_metadata",
      client_secret: "secret_without_metadata"
    }
  });

  const result = await createPaymentIntent({ amount: 500 }, { stripeClient: stripe.client });

  assert.deepEqual(stripe.calls, [
    {
      amount: 500,
      currency: "usd"
    }
  ]);
  assert.equal(result.paymentId, "pi_without_metadata");
  assert.equal(result.clientSecret, "secret_without_metadata");
});

test("createPaymentIntent rejects missing or invalid amount before calling Stripe", async () => {
  const stripe = createMockStripeClient();

  await assert.rejects(
    () => createPaymentIntent({ currency: "usd" }, { stripeClient: stripe.client }),
    /Payment amount is required and must be a positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }, { stripeClient: stripe.client }),
    /Payment amount is required and must be a positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient: stripe.client }),
    /Payment amount is required and must be a positive integer/
  );

  assert.deepEqual(stripe.calls, []);
});

test("createPaymentIntent rejects invalid currency and metadata before calling Stripe", async () => {
  const stripe = createMockStripeClient();

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usdollars" }, { stripeClient: stripe.client }),
    /Payment currency must be a three-letter ISO currency code/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: ["order"] }, { stripeClient: stripe.client }),
    /Payment metadata must be an object when provided/
  );
  await assert.rejects(
    () =>
      createPaymentIntent(
        {
          amount: 1000,
          metadata: {
            nested: { id: "order_123" }
          }
        },
        { stripeClient: stripe.client }
      ),
    /Payment metadata values must be strings, numbers, or booleans/
  );

  assert.deepEqual(stripe.calls, []);
});

test("createPaymentIntent requires STRIPE_SECRET_KEY when no Stripe client is injected", async () => {
  const previousKey = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  resetStripeClientForTests();

  try {
    await assert.rejects(
      () => createPaymentIntent({ amount: 1000 }),
      /STRIPE_SECRET_KEY is required to create Stripe payments/
    );
  } finally {
    if (previousKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = previousKey;
    }
    resetStripeClientForTests();
  }
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripe = createMockStripeClient({
    error: {
      type: "StripeInvalidRequestError",
      message: "No such customer: cus_missing"
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripeClient: stripe.client }),
    /Stripe payment failed: No such customer: cus_missing/
  );
});
