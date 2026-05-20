import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  PaymentProviderError,
  PaymentValidationError
} from "../services/paymentService.js";

function createMockStripeClient(handler) {
  return {
    paymentIntents: {
      create: handler
    }
  };
}

test("createPaymentIntent creates a Stripe PaymentIntent with validated payload values", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(async (payload) => {
    calls.push(payload);
    return {
      id: "pi_test_123",
      client_secret: "pi_test_123_secret_abc",
      amount: payload.amount,
      currency: payload.currency
    };
  });

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: {
        jobId: "job_123",
        retry: 1,
        escrowed: true
      }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        retry: "1",
        escrowed: "true"
      }
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

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(async (payload) => {
    calls.push(payload);
    return {
      id: "pi_default_currency",
      client_secret: "pi_default_currency_secret",
      amount: payload.amount,
      currency: payload.currency
    };
  });

  await createPaymentIntent({ amount: 1000 }, { stripeClient });

  assert.equal(calls[0].currency, "usd");
});

test("createPaymentIntent rejects invalid amount values before calling Stripe", async () => {
  let calls = 0;
  const stripeClient = createMockStripeClient(async () => {
    calls += 1;
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    PaymentValidationError
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 12.5 }, { stripeClient }),
    PaymentValidationError
  );
  await assert.rejects(
    () => createPaymentIntent({}, { stripeClient }),
    PaymentValidationError
  );

  assert.equal(calls, 0);
});

test("createPaymentIntent rejects invalid currency and metadata", async () => {
  const stripeClient = createMockStripeClient(async () => {
    throw new Error("Stripe should not be called");
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usdollar" }, { stripeClient }),
    PaymentValidationError
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: ["bad"] }, { stripeClient }),
    PaymentValidationError
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: { bad: null } }, { stripeClient }),
    PaymentValidationError
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = createMockStripeClient(async () => {
    const error = new Error("No such payment method: pm_missing");
    error.type = "StripeInvalidRequestError";
    throw error;
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripeClient }),
    (error) => {
      assert.ok(error instanceof PaymentProviderError);
      assert.equal(error.statusCode, 502);
      assert.match(error.message, /No such payment method: pm_missing/);
      return true;
    }
  );
});
