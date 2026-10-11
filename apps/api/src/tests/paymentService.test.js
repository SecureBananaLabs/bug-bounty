import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  PaymentServiceError,
  setStripeFactoryForTests
} from "../services/paymentService.js";

function withStripeMock(assertions) {
  const calls = [];
  const paymentIntents = {
    create: async (payload) => {
      calls.push(payload);
      return {
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_456"
      };
    }
  };

  setStripeFactoryForTests((secretKey) => {
    assertions.secretKey = secretKey;
    return { paymentIntents };
  });

  return calls;
}

test.afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  setStripeFactoryForTests();
});

test("createPaymentIntent creates a Stripe PaymentIntent with validated input", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const assertions = {};
  const calls = withStripeMock(assertions);

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "EUR",
    metadata: { jobId: "job_123" }
  });

  assert.equal(assertions.secretKey, "sk_test_mock");
  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "eur",
      metadata: { jobId: "job_123" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2500,
    currency: "eur",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const assertions = {};
  const calls = withStripeMock(assertions);

  await createPaymentIntent({ amount: 1000 });

  assert.deepEqual(calls, [{ amount: 1000, currency: "usd" }]);
});

test("createPaymentIntent rejects missing or invalid amounts", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  await assert.rejects(
    () => createPaymentIntent({ currency: "usd" }),
    /amount is required and must be a positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 0, currency: "usd" }),
    /amount is required and must be a positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5, currency: "usd" }),
    /amount is required and must be a positive integer/
  );
});

test("createPaymentIntent rejects invalid currency and metadata", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "us" }),
    /currency must be a three-letter ISO currency code/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: [] }),
    /metadata must be an object/
  );
});

test("createPaymentIntent requires STRIPE_SECRET_KEY before contacting Stripe", async () => {
  let contactedStripe = false;
  setStripeFactoryForTests(() => {
    contactedStripe = true;
    return { paymentIntents: { create: async () => ({}) } };
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usd" }),
    (error) => {
      assert.equal(error instanceof PaymentServiceError, true);
      assert.equal(error.statusCode, 500);
      assert.match(error.message, /STRIPE_SECRET_KEY/);
      return true;
    }
  );
  assert.equal(contactedStripe, false);
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeFactoryForTests(() => ({
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined");
        error.type = "StripeCardError";
        throw error;
      }
    }
  }));

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usd" }),
    (error) => {
      assert.equal(error.statusCode, 502);
      assert.equal(error.message, "Your card was declined");
      return true;
    }
  );
});
