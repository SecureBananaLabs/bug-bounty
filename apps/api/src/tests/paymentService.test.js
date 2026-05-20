import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent validates amount before calling Stripe", async () => {
  const stripeClient = {
    paymentIntents: {
      create: test.mock.fn()
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0, currency: "usd" }, stripeClient),
    /payload\.amount must be a positive integer/
  );

  assert.equal(stripeClient.paymentIntents.create.mock.callCount(), 0);
});

test("createPaymentIntent defaults currency and maps Stripe response fields", async () => {
  const stripeClient = {
    paymentIntents: {
      create: test.mock.fn(async () => ({
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_456"
      }))
    }
  };

  const result = await createPaymentIntent({ amount: 2500 }, stripeClient);

  assert.deepEqual(stripeClient.paymentIntents.create.mock.calls[0].arguments[0], {
    amount: 2500,
    currency: "usd",
    metadata: {}
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456"
  });
});

test("createPaymentIntent passes currency and metadata to Stripe", async () => {
  const stripeClient = {
    paymentIntents: {
      create: test.mock.fn(async () => ({
        id: "pi_test_metadata",
        client_secret: "pi_test_metadata_secret"
      }))
    }
  };

  await createPaymentIntent(
    {
      amount: 4999,
      currency: "CAD",
      metadata: { jobId: "job_123", source: "api" }
    },
    stripeClient
  );

  assert.deepEqual(stripeClient.paymentIntents.create.mock.calls[0].arguments[0], {
    amount: 4999,
    currency: "cad",
    metadata: { jobId: "job_123", source: "api" }
  });
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      create: test.mock.fn(async () => {
        throw new Error("Your card was declined.");
      })
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1200, currency: "usd" }, stripeClient),
    /Your card was declined\./
  );
});
