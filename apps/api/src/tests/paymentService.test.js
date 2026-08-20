import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent validates amount before calling Stripe", async () => {
  const stripeClient = {
    paymentIntents: {
      create() {
        throw new Error("Stripe should not be called for invalid payloads");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ currency: "usd" }, { stripeClient }),
    /amount is required/
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    /positive integer/
  );
});

test("createPaymentIntent creates a Stripe PaymentIntent with defaults", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      async create(params) {
        calls.push(params);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456"
        };
      }
    }
  };

  const result = await createPaymentIntent({ amount: 2500 }, { stripeClient });

  assert.deepEqual(calls, [{ amount: 2500, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent normalizes currency and forwards safe metadata", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      async create(params) {
        calls.push(params);
        return {
          id: "pi_test_meta",
          client_secret: "pi_test_meta_secret"
        };
      }
    }
  };

  await createPaymentIntent(
    {
      amount: 1999,
      currency: "EUR",
      metadata: {
        projectId: "proj_123",
        invoiceNumber: 42
      }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 1999,
      currency: "eur",
      metadata: {
        projectId: "proj_123",
        invoiceNumber: "42"
      }
    }
  ]);
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined");
        error.type = "StripeCardError";
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 2500 }, { stripeClient }),
    /Your card was declined/
  );
});

test("createPaymentIntent can smoke-test a live Stripe test-mode PaymentIntent", { skip: !process.env.RUN_STRIPE_PAYMENT_SMOKE }, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      smoke: "true"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
});
