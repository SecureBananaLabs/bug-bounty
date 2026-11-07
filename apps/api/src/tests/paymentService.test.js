import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent calls Stripe with validated amount, currency, and metadata", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        return {
          id: "pi_mock_123",
          client_secret: "pi_mock_123_secret_abc"
        };
      }
    }
  };

  const result = await createPaymentIntent(
    {
      amount: 2599,
      currency: "GBP",
      metadata: {
        jobId: "job_123",
        priority: 2,
        escrow: true
      }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2599,
      currency: "gbp",
      metadata: {
        jobId: "job_123",
        priority: "2",
        escrow: "true"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_mock_123",
    clientSecret: "pi_mock_123_secret_abc",
    amount: 2599,
    currency: "gbp",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        return {
          id: "pi_default_currency",
          client_secret: "pi_default_currency_secret"
        };
      }
    }
  };

  await createPaymentIntent({ amount: 500 }, { stripeClient });

  assert.deepEqual(calls, [{ amount: 500, currency: "usd" }]);
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw new Error("Stripe should not be called");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 12.5 }, { stripeClient }),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({}, { stripeClient }),
    /positive integer/
  );
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        error.statusCode = 402;
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1200 }, { stripeClient }),
    (error) => {
      assert.equal(error.message, "Your card was declined.");
      assert.equal(error.status, 402);
      assert.equal(error.expose, true);
      return true;
    }
  );
});

test(
  "createPaymentIntent can create a live Stripe test-mode PaymentIntent",
  { skip: !process.env.RUN_STRIPE_PAYMENT_SMOKE || !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { smoke: true }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
  }
);
