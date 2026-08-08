import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  PaymentConfigurationError,
  PaymentProviderError,
  PaymentValidationError
} from "../services/paymentService.js";

function createMockStripeClient(responseOrError, calls = []) {
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

test("createPaymentIntent creates a Stripe PaymentIntent with validated defaults", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(
    {
      id: "pi_test_123",
      client_secret: "pi_test_123_secret_abc",
      amount: 1250,
      currency: "usd"
    },
    calls
  );

  const result = await createPaymentIntent(
    {
      amount: 1250,
      metadata: {
        jobId: 42,
        milestoneId: "m_1",
        emptyValue: null
      }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 1250,
      currency: "usd",
      metadata: {
        jobId: "42",
        milestoneId: "m_1"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 1250,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent normalizes explicit currency before calling Stripe", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(
    {
      id: "pi_test_eur",
      client_secret: "pi_test_eur_secret",
      amount: 5000,
      currency: "eur"
    },
    calls
  );

  await createPaymentIntent({ amount: 5000, currency: " EUR " }, { stripeClient });

  assert.deepEqual(calls, [{ amount: 5000, currency: "eur" }]);
});

test("createPaymentIntent rejects missing or invalid amounts before Stripe is called", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient({}, calls);

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    PaymentValidationError
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 12.34 }, { stripeClient }),
    /positive integer/
  );

  assert.deepEqual(calls, []);
});

test("createPaymentIntent rejects invalid payload and metadata shapes", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient({}, calls);

  await assert.rejects(
    () => createPaymentIntent(null, { stripeClient }),
    /payload must be an object/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 500, metadata: [] }, { stripeClient }),
    /metadata must be an object/
  );
  await assert.rejects(
    () =>
      createPaymentIntent(
        {
          amount: 500,
          metadata: {
            " ": "invalid"
          }
        },
        { stripeClient }
      ),
    /metadata keys must not be empty/
  );

  assert.deepEqual(calls, []);
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeError = new Error("Your card was declined");
  stripeError.type = "StripeCardError";
  const stripeClient = createMockStripeClient(stripeError);

  await assert.rejects(
    () => createPaymentIntent({ amount: 1500 }, { stripeClient }),
    (error) =>
      error instanceof PaymentProviderError &&
      error.message === "Your card was declined" &&
      error.cause === stripeError
  );
});

test("createPaymentIntent reports missing Stripe configuration after validation", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 100 }),
    PaymentConfigurationError
  );
});
