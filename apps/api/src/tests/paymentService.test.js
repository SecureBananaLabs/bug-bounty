import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

function createMockStripeClient(responseOrError, calls = []) {
  return {
    paymentIntents: {
      async create(args) {
        calls.push(args);

        if (responseOrError instanceof Error) {
          throw responseOrError;
        }

        return responseOrError;
      }
    }
  };
}

test("createPaymentIntent validates amount before calling Stripe", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient({ id: "pi_unused", client_secret: "secret_unused" }, calls);

  for (const amount of [undefined, null, 0, -1, 10.5, "100"]) {
    await assert.rejects(
      () => createPaymentIntent({ amount }, { stripeClient }),
      /amount must be a positive integer/i
    );
  }

  assert.deepEqual(calls, []);
});

test("createPaymentIntent defaults currency to usd and maps Stripe response fields", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(
    { id: "pi_123", client_secret: "pi_123_secret_456" },
    calls
  );

  const result = await createPaymentIntent(
    { amount: 2599, metadata: { jobId: "job_123" } },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2599,
      currency: "usd",
      metadata: { jobId: "job_123" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_123",
    clientSecret: "pi_123_secret_456",
    amount: 2599,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent initializes Stripe from STRIPE_SECRET_KEY when no client is injected", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient({ id: "pi_live", client_secret: "secret_live" }, calls);
  const factoryCalls = [];

  const result = await createPaymentIntent(
    { amount: 1000, currency: "eur" },
    {
      env: { stripeSecretKey: "unit-test-secret" },
      stripeFactory(secretKey) {
        factoryCalls.push(secretKey);
        return stripeClient;
      }
    }
  );

  assert.deepEqual(factoryCalls, ["unit-test-secret"]);
  assert.deepEqual(calls, [{ amount: 1000, currency: "eur" }]);
  assert.equal(result.paymentId, "pi_live");
  assert.equal(result.clientSecret, "secret_live");
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = new Error("No such customer: cus_missing");
  stripeError.type = "StripeInvalidRequestError";
  const stripeClient = createMockStripeClient(stripeError);

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripeClient }),
    (error) =>
      error.message.includes("Stripe payment intent creation failed") &&
      error.message.includes("No such customer: cus_missing")
  );
});

test("createPaymentIntent rejects invalid metadata values", async () => {
  const stripeClient = createMockStripeClient({ id: "pi_unused", client_secret: "secret_unused" });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: "job_123" }, { stripeClient }),
    /metadata must be an object/i
  );
});
