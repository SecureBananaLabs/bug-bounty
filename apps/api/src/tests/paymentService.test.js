import test from "node:test";
import assert from "node:assert/strict";

process.env.STRIPE_SECRET_KEY ??= "sk_test_unit";

const paymentService = await import("../services/paymentService.js");
const { createPaymentIntent, resetStripeFactoryForTest, setStripeFactoryForTest, smokeTestPaymentIntent } =
  paymentService;

test.afterEach(() => {
  resetStripeFactoryForTest();
  delete process.env.RUN_STRIPE_SMOKE_TEST;
});

test("createPaymentIntent creates a Stripe PaymentIntent and maps the response", async () => {
  const calls = [];
  setStripeFactoryForTest((secretKey) => {
    assert.equal(secretKey, "sk_test_unit");
    return {
      paymentIntents: {
        async create(args) {
          calls.push(args);
          return {
            id: "pi_test_123",
            client_secret: "pi_test_123_secret_456"
          };
        }
      }
    };
  });

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: { invoiceId: "inv_123" }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: { invoiceId: "inv_123" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent validates amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /amount is required and must be a positive integer/
  );
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  setStripeFactoryForTest(() => ({
    paymentIntents: {
      async create() {
        const error = new Error("Invalid API Key provided");
        error.type = "StripeAuthenticationError";
        throw error;
      }
    }
  }));

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    /Stripe StripeAuthenticationError: Invalid API Key provided/
  );
});

test("smokeTestPaymentIntent is guarded by RUN_STRIPE_SMOKE_TEST", async () => {
  const result = await smokeTestPaymentIntent();

  assert.deepEqual(result, {
    skipped: true,
    reason: "Set RUN_STRIPE_SMOKE_TEST=true to run Stripe smoke test."
  });
});

test(
  "guarded Stripe smoke test creates a test-mode PaymentIntent",
  { skip: process.env.RUN_STRIPE_SMOKE_TEST !== "true" },
  async () => {
    process.env.RUN_STRIPE_SMOKE_TEST = "true";
    const result = await smokeTestPaymentIntent();

    assert.equal(result.skipped, false);
    assert.match(result.result.paymentId, /^pi_/);
    assert.match(result.result.clientSecret, /^pi_.*_secret_/);
    assert.equal(result.result.amount, 100);
    assert.equal(result.result.currency, "usd");
  }
);
