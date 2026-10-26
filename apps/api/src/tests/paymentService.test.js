import test from "node:test";
import assert from "node:assert/strict";
import { buildPaymentService } from "../services/paymentService.js";

function createStripeMock({ createResponse, createError } = {}) {
  const calls = [];

  return {
    calls,
    stripe: {
      paymentIntents: {
        async create(payload) {
          calls.push(payload);

          if (createError) {
            throw createError;
          }

          return createResponse ?? {
            id: "pi_test_123",
            client_secret: "pi_test_123_secret_abc",
            amount: payload.amount,
            currency: payload.currency
          };
        }
      }
    }
  };
}

test("createPaymentIntent validates and maps Stripe PaymentIntent responses", async () => {
  const { stripe, calls } = createStripeMock();
  const service = buildPaymentService({ stripe });

  const result = await service.createPaymentIntent({
    amount: 2500,
    metadata: { orderId: "order_123" }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: { orderId: "order_123" }
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

test("createPaymentIntent rejects invalid payment payloads before calling Stripe", async () => {
  const { stripe, calls } = createStripeMock();
  const service = buildPaymentService({ stripe });

  await assert.rejects(
    () => service.createPaymentIntent({ amount: 0 }),
    /payload\.amount must be a positive integer/
  );
  await assert.rejects(
    () => service.createPaymentIntent({ amount: 100, currency: "us" }),
    /payload\.currency must be a 3-letter ISO currency code/
  );
  await assert.rejects(
    () => service.createPaymentIntent({ amount: 100, metadata: null }),
    /payload\.metadata must be an object/
  );

  assert.deepEqual(calls, []);
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeError = new Error("No such customer: cus_missing");
  stripeError.type = "StripeInvalidRequestError";

  const { stripe } = createStripeMock({ createError: stripeError });
  const service = buildPaymentService({ stripe });

  await assert.rejects(
    () => service.createPaymentIntent({ amount: 1000, currency: "EUR" }),
    /Stripe error: No such customer: cus_missing/
  );
});

test("createPaymentIntent smoke test creates a Stripe test-mode PaymentIntent", { skip: !process.env.RUN_STRIPE_SMOKE_TEST }, async () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required when RUN_STRIPE_SMOKE_TEST is set");
  }

  const { createPaymentIntent } = await import("../services/paymentService.js");
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smokeTest: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.equal(typeof result.clientSecret, "string");
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
});
