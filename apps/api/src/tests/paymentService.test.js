import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

function createMockStripe(response, calls = []) {
  return {
    paymentIntents: {
      async create(args) {
        calls.push(args);
        if (response instanceof Error) {
          throw response;
        }

        return response;
      }
    }
  };
}

test("createPaymentIntent validates amount before calling Stripe", async () => {
  const calls = [];

  await assert.rejects(
    createPaymentIntent({ amount: 0 }, { stripeClient: createMockStripe({}, calls) }),
    /amount is required/
  );

  assert.deepEqual(calls, []);
});

test("createPaymentIntent defaults currency and maps Stripe response", async () => {
  const calls = [];
  const result = await createPaymentIntent(
    { amount: 2500 },
    {
      stripeClient: createMockStripe(
        { id: "pi_test_123", client_secret: "pi_test_123_secret_abc" },
        calls
      )
    }
  );

  assert.deepEqual(calls, [{ amount: 2500, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent lowercases currency and stringifies metadata values", async () => {
  const calls = [];

  await createPaymentIntent(
    { amount: 1099, currency: "CAD", metadata: { jobId: 42, source: "checkout" } },
    {
      stripeClient: createMockStripe(
        { id: "pi_test_456", client_secret: "pi_test_456_secret_def" },
        calls
      )
    }
  );

  assert.deepEqual(calls, [
    {
      amount: 1099,
      currency: "cad",
      metadata: { jobId: "42", source: "checkout" }
    }
  ]);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.type = "StripeCardError";
  stripeError.statusCode = 402;

  await assert.rejects(
    createPaymentIntent({ amount: 1000 }, { stripeClient: createMockStripe(stripeError) }),
    (error) => {
      assert.equal(error instanceof PaymentServiceError, true);
      assert.equal(error.message, "Your card was declined.");
      assert.equal(error.statusCode, 402);
      return true;
    }
  );
});

test("createPaymentIntent requires STRIPE_SECRET_KEY when no client is injected", async () => {
  const previous = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;

  await assert.rejects(
    createPaymentIntent({ amount: 1000 }),
    /STRIPE_SECRET_KEY is required/
  );

  if (previous == null) {
    delete process.env.STRIPE_SECRET_KEY;
  } else {
    process.env.STRIPE_SECRET_KEY = previous;
  }
});

test(
  "createPaymentIntent can create a Stripe test-mode PaymentIntent",
  { skip: process.env.STRIPE_PAYMENT_SMOKE !== "true" },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { smoke: "true" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
  }
);
