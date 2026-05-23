import assert from "node:assert/strict";
import test from "node:test";
import { env } from "../config/env.js";
import {
  PaymentConfigurationError,
  PaymentProviderError,
  PaymentValidationError,
  buildPaymentIntentRequest,
  createPaymentIntent,
  normalizePaymentPayload,
  resetStripeClientForTesting,
  setStripeClientForTesting
} from "../services/paymentService.js";

function fakeStripeClient(handler) {
  const calls = [];

  return {
    calls,
    paymentIntents: {
      async create(params, requestOptions) {
        calls.push({ params, requestOptions });
        return handler(params, requestOptions);
      }
    }
  };
}

test.afterEach(() => {
  resetStripeClientForTesting();
});

test("normalizes payment payload defaults", () => {
  assert.deepEqual(normalizePaymentPayload({ amount: 2500 }), {
    amount: 2500,
    currency: "usd",
    metadata: undefined,
    idempotencyKey: undefined
  });
});

test("normalizes Stripe metadata and request options", () => {
  assert.deepEqual(
    buildPaymentIntentRequest({
      amount: 2500,
      currency: " EUR ",
      metadata: { jobId: "job_123", attempt: 2, expedited: false },
      idempotencyKey: " checkout-session-123 "
    }),
    {
      params: {
        amount: 2500,
        currency: "eur",
        metadata: { jobId: "job_123", attempt: "2", expedited: "false" }
      },
      requestOptions: { idempotencyKey: "checkout-session-123" }
    }
  );
});

test("creates a Stripe payment intent and returns client credentials", async () => {
  const stripeClient = fakeStripeClient((params) => ({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_abc",
    amount: params.amount,
    currency: params.currency
  }));

  const result = await createPaymentIntent(
    {
      amount: 1999,
      currency: "EUR",
      metadata: { jobId: "job_123", userId: "user_456" },
      idempotencyKey: "job_123:user_456:1999"
    },
    { stripeClient }
  );

  assert.deepEqual(stripeClient.calls, [
    {
      params: {
        amount: 1999,
        currency: "eur",
        metadata: { jobId: "job_123", userId: "user_456" }
      },
      requestOptions: { idempotencyKey: "job_123:user_456:1999" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 1999,
    currency: "eur",
    provider: "stripe"
  });
});

test("supports a mocked Stripe SDK client set at module level", async () => {
  const stripeClient = fakeStripeClient((params) => ({
    id: "pi_sdk_mock",
    client_secret: "pi_sdk_mock_secret_abc",
    amount: params.amount,
    currency: params.currency
  }));
  setStripeClientForTesting(stripeClient);

  const result = await createPaymentIntent({ amount: 500 });

  assert.equal(result.paymentId, "pi_sdk_mock");
  assert.deepEqual(stripeClient.calls[0], {
    params: { amount: 500, currency: "usd" },
    requestOptions: undefined
  });
});

test("rejects invalid payment payloads before calling Stripe", async () => {
  const stripeClient = fakeStripeClient(() => {
    throw new Error("Stripe should not be called");
  });

  const invalidPayloads = [
    null,
    {},
    { amount: 0 },
    { amount: 10.5 },
    { amount: 100, currency: "eu" },
    { amount: 100, currency: "euro" },
    { amount: 100, metadata: [] },
    { amount: 100, metadata: { nested: { nope: true } } },
    { amount: 100, metadata: { "bad[key]": "value" } },
    { amount: 100, metadata: Object.fromEntries(Array.from({ length: 51 }, (_, index) => ["key" + index, "value"])) },
    { amount: 100, idempotencyKey: "" },
    { amount: 100, idempotencyKey: 123 }
  ];

  for (const payload of invalidPayloads) {
    await assert.rejects(
      () => createPaymentIntent(payload, { stripeClient }),
      PaymentValidationError
    );
  }

  assert.equal(stripeClient.calls.length, 0);
});

test("fails fast when Stripe is not configured", async () => {
  const previousKey = env.stripeSecretKey;
  env.stripeSecretKey = "";

  try {
    await assert.rejects(
      () => createPaymentIntent({ amount: 1500 }),
      (error) => {
        assert.ok(error instanceof PaymentConfigurationError);
        assert.equal(error.statusCode, 503);
        assert.equal(error.message, "Payment provider is not configured");
        return true;
      }
    );
  } finally {
    env.stripeSecretKey = previousKey;
  }
});

test("surfaces Stripe provider errors with readable context", async () => {
  const stripeClient = fakeStripeClient(() => {
    const error = new Error("Your card was declined");
    error.type = "StripeCardError";
    error.statusCode = 402;
    throw error;
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1500, currency: "usd" }, { stripeClient }),
    (error) => {
      assert.ok(error instanceof PaymentProviderError);
      assert.equal(error.statusCode, 402);
      assert.equal(error.message, "Stripe payment failed: Your card was declined");
      return true;
    }
  );
});
