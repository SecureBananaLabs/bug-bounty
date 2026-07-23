import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

function createMockStripeClient({ response, error } = {}) {
  const calls = [];

  return {
    calls,
    paymentIntents: {
      async create(params) {
        calls.push(params);
        if (error) {
          throw error;
        }

        return response ?? {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_test",
          amount: params.amount,
          currency: params.currency
        };
      }
    }
  };
}

test("createPaymentIntent creates a Stripe PaymentIntent and maps the response", async () => {
  const stripeClient = createMockStripeClient();

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "EUR",
      metadata: { jobId: "job_123", retry: 1 }
    },
    { stripeClient }
  );

  assert.deepEqual(stripeClient.calls, [
    {
      amount: 2500,
      currency: "eur",
      metadata: {
        jobId: "job_123",
        retry: "1"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_test",
    amount: 2500,
    currency: "eur",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const stripeClient = createMockStripeClient();

  await createPaymentIntent({ amount: 1200 }, { stripeClient });

  assert.deepEqual(stripeClient.calls, [{ amount: 1200, currency: "usd" }]);
});

test("createPaymentIntent rejects missing or invalid amounts", async () => {
  const stripeClient = createMockStripeClient();

  await assert.rejects(
    () => createPaymentIntent({ currency: "usd" }, { stripeClient }),
    (error) => error instanceof PaymentServiceError && error.status === 400 && error.message.includes("amount is required")
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    (error) => error instanceof PaymentServiceError && error.status === 400 && error.message.includes("amount is required")
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }, { stripeClient }),
    (error) => error instanceof PaymentServiceError && error.status === 400 && error.message.includes("amount is required")
  );

  assert.deepEqual(stripeClient.calls, []);
});

test("createPaymentIntent rejects invalid currency and metadata values", async () => {
  const stripeClient = createMockStripeClient();

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usdollar" }, { stripeClient }),
    (error) => error instanceof PaymentServiceError && error.message.includes("currency")
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: { nested: { bad: true } } }, { stripeClient }),
    (error) => error instanceof PaymentServiceError && error.message.includes("metadata values")
  );

  assert.deepEqual(stripeClient.calls, []);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = Object.assign(new Error("Your card was declined."), { statusCode: 402 });
  const stripeClient = createMockStripeClient({ error: stripeError });

  await assert.rejects(
    () => createPaymentIntent({ amount: 2500 }, { stripeClient }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.status === 402 &&
      error.message === "Your card was declined." &&
      error.cause === stripeError
  );
});

test(
  "createPaymentIntent can create a live Stripe test-mode PaymentIntent",
  { skip: !process.env.RUN_STRIPE_SMOKE_TEST || !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { source: "node-test" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
    assert.equal(result.provider, "stripe");
  }
);
