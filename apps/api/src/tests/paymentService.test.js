import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  resetStripeClientFactoryForTests,
  setStripeClientFactoryForTests
} from "../services/paymentService.js";

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_INTEGRATION_TEST;
  resetStripeClientFactoryForTests();
});

test("createPaymentIntent creates a Stripe payment intent with validated defaults", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_unit";
  const calls = [];

  setStripeClientFactoryForTests((secretKey) => {
    assert.equal(secretKey, "sk_test_unit");

    return {
      paymentIntents: {
        async create(params) {
          calls.push(params);
          return {
            id: "pi_unit_123",
            client_secret: "pi_unit_123_secret"
          };
        }
      }
    };
  });

  const result = await createPaymentIntent({
    amount: 2500,
    metadata: {
      proposalId: "prp_123",
      attempt: 1
    }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        proposalId: "prp_123",
        attempt: "1"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_unit_123",
    clientSecret: "pi_unit_123_secret",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent validates positive integer amount before calling Stripe", async () => {
  setStripeClientFactoryForTests(() => {
    throw new Error("Stripe should not be initialised for invalid input");
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /positive integer/
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_unit";

  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  }));

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "USD" }),
    /Your card was declined/
  );
});

test("createPaymentIntent can run a guarded Stripe smoke test", { skip: process.env.STRIPE_INTEGRATION_TEST !== "1" }, async () => {
  assert.ok(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY is required for the guarded smoke test");

  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      test: "payment-service-smoke"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.equal(result.provider, "stripe");
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
  assert.ok(result.clientSecret);
});
