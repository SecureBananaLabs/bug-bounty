import test from "node:test";
import assert from "node:assert/strict";
import {
  PaymentProviderError,
  PaymentValidationError,
  createPaymentIntent
} from "../services/paymentService.js";

test("createPaymentIntent creates a Stripe payment intent", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      async create(args) {
        calls.push(args);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_secret_123",
          amount: args.amount,
          currency: args.currency
        };
      }
    }
  };

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: { jobId: 42 }
  }, { stripeClient });

  assert.deepEqual(calls, [{
    amount: 2500,
    currency: "usd",
    metadata: { jobId: "42" }
  }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_secret_123",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const stripeClient = {
    paymentIntents: {
      async create(args) {
        return {
          id: "pi_default_currency",
          client_secret: "secret",
          amount: args.amount,
          currency: args.currency
        };
      }
    }
  };

  const result = await createPaymentIntent({ amount: 1000 }, { stripeClient });

  assert.equal(result.currency, "usd");
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  let called = false;
  const stripeClient = {
    paymentIntents: {
      async create() {
        called = true;
      }
    }
  };

  await assert.rejects(
    createPaymentIntent({ amount: 1.25 }, { stripeClient }),
    PaymentValidationError
  );
  assert.equal(called, false);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  };

  await assert.rejects(
    createPaymentIntent({ amount: 1000 }, { stripeClient }),
    (error) => error instanceof PaymentProviderError && error.message === "Your card was declined."
  );
});

test("createPaymentIntent live Stripe smoke test", {
  skip: process.env.RUN_STRIPE_SMOKE !== "true" || !process.env.STRIPE_SECRET_KEY
}, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_/);
});
