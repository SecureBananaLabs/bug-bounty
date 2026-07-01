import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

test("createPaymentIntent validates amount before calling Stripe", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw new Error("Stripe should not be called for invalid input");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    (error) => {
      assert.ok(error instanceof PaymentServiceError);
      assert.equal(error.status, 400);
      assert.equal(error.code, "INVALID_PAYMENT_AMOUNT");
      assert.match(error.message, /positive integer/);
      return true;
    }
  );
});

test("createPaymentIntent creates a Stripe PaymentIntent with default currency", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (params) => {
        calls.push(params);
        return {
          id: "pi_test_default",
          client_secret: "pi_test_default_secret"
        };
      }
    }
  };

  const result = await createPaymentIntent({ amount: 1099 }, { stripeClient });

  assert.deepEqual(calls, [{ amount: 1099, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_default",
    clientSecret: "pi_test_default_secret",
    amount: 1099,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent normalizes currency and metadata", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (params) => {
        calls.push(params);
        return {
          id: "pi_test_metadata",
          client_secret: "pi_test_metadata_secret"
        };
      }
    }
  };

  await createPaymentIntent(
    {
      amount: 2500,
      currency: "MXN",
      metadata: {
        jobId: 42,
        channel: "api",
        ignored: null
      }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "mxn",
      metadata: {
        jobId: "42",
        channel: "api"
      }
    }
  ]);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = Object.assign(new Error("Your card was declined."), {
    type: "StripeCardError",
    statusCode: 402
  });
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw stripeError;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1099, currency: "usd" }, { stripeClient }),
    (error) => {
      assert.ok(error instanceof PaymentServiceError);
      assert.equal(error.status, 402);
      assert.equal(error.code, "StripeCardError");
      assert.equal(error.message, "Your card was declined.");
      return true;
    }
  );
});
