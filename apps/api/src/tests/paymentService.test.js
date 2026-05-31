import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../config/env.js";
import {
  createPaymentIntent,
  PaymentConfigurationError,
  PaymentProviderError,
  PaymentValidationError,
  resetStripeClientForTesting
} from "../services/paymentService.js";

test.afterEach(() => {
  resetStripeClientForTesting();
});

function createStripeClient(responseOrError, calls = []) {
  return {
    paymentIntents: {
      async create(params) {
        calls.push(params);

        if (responseOrError instanceof Error) {
          throw responseOrError;
        }

        return responseOrError;
      }
    }
  };
}

test("createPaymentIntent validates, normalizes, and sends Stripe PaymentIntent params", async () => {
  const calls = [];
  const stripeClient = createStripeClient(
    {
      id: "pi_unit_123",
      client_secret: "pi_unit_123_secret_456",
      amount: 2599,
      currency: "usd"
    },
    calls
  );

  const result = await createPaymentIntent(
    {
      amount: 2599,
      currency: " USD ",
      metadata: {
        jobId: "job_123",
        milestone: 2,
        escrow: true
      }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2599,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        milestone: "2",
        escrow: "true"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_unit_123",
    clientSecret: "pi_unit_123_secret_456",
    amount: 2599,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd and omits empty metadata", async () => {
  const calls = [];
  const stripeClient = createStripeClient(
    {
      id: "pi_default_123",
      client_secret: "pi_default_123_secret_456",
      amount: 1000,
      currency: "usd"
    },
    calls
  );

  await createPaymentIntent({ amount: 1000 }, { stripeClient });

  assert.deepEqual(calls, [{ amount: 1000, currency: "usd" }]);
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  const calls = [];
  const stripeClient = createStripeClient(
    {
      id: "pi_should_not_exist",
      client_secret: "unused"
    },
    calls
  );

  for (const amount of [undefined, null, 0, -1, 12.5, "100"]) {
    await assert.rejects(
      () => createPaymentIntent({ amount }, { stripeClient }),
      (error) =>
        error instanceof PaymentValidationError &&
        error.message ===
          "amount is required and must be a positive integer in the smallest currency unit"
    );
  }

  assert.deepEqual(calls, []);
});

test("createPaymentIntent validates currency and metadata before calling Stripe", async () => {
  const calls = [];
  const stripeClient = createStripeClient({}, calls);

  await assert.rejects(
    () => createPaymentIntent({ amount: 500, currency: "usdollar" }, { stripeClient }),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "currency must be a three-letter ISO currency code"
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 500, metadata: null }, { stripeClient }),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "metadata must be a flat object when provided"
  );
  await assert.rejects(
    () =>
      createPaymentIntent(
        { amount: 500, metadata: { receipt: { nested: true } } },
        { stripeClient }
      ),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "metadata values must be strings, numbers, or booleans"
  );

  assert.deepEqual(calls, []);
});

test("createPaymentIntent preserves original Stripe error messages", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.type = "StripeCardError";
  stripeError.statusCode = 402;
  const stripeClient = createStripeClient(stripeError);

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripeClient }),
    (error) =>
      error instanceof PaymentProviderError &&
      error.message === "Your card was declined." &&
      error.statusCode === 402 &&
      error.cause === stripeError
  );
});

test("createPaymentIntent reports missing Stripe configuration after payload validation", async () => {
  const originalSecret = process.env.STRIPE_SECRET_KEY;
  const originalEnvSecret = env.stripeSecretKey;

  try {
    delete process.env.STRIPE_SECRET_KEY;
    env.stripeSecretKey = "";

    await assert.rejects(
      () => createPaymentIntent({ amount: 1000 }),
      (error) =>
        error instanceof PaymentConfigurationError &&
        error.statusCode === 500 &&
        error.message === "STRIPE_SECRET_KEY is required to create payment intents"
    );
  } finally {
    if (originalSecret === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalSecret;
    }
    env.stripeSecretKey = originalEnvSecret;
    resetStripeClientForTesting();
  }
});
