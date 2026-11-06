import test from "node:test";
import assert from "node:assert/strict";

// The npm test script provides a dummy STRIPE_SECRET_KEY for local runs.
// No credential placeholder is committed here.
const { createPaymentIntent, getStripeClient } = await import(
  "../services/paymentService.js"
);
const { env } = await import("../config/env.js");

function mockStripeCreate(implementation) {
  const client = getStripeClient();
  const calls = [];
  const original = client.paymentIntents.create;

  client.paymentIntents.create = async (params, options) => {
    calls.push({ params, options });
    return implementation(params, options);
  };

  return {
    calls,
    restore() {
      client.paymentIntents.create = original;
    }
  };
}

test("createPaymentIntent calls Stripe with amount and default usd currency", async () => {
  const mock = mockStripeCreate(async (params) => ({
    id: "pi_test_default",
    client_secret: "pi_test_default_secret",
    amount: params.amount,
    currency: params.currency
  }));

  try {
    const result = await createPaymentIntent({ amount: 2500 });

    assert.deepEqual(
      mock.calls.map((call) => call.params),
      [{ amount: 2500, currency: "usd" }]
    );
    assert.deepEqual(result, {
      paymentId: "pi_test_default",
      clientSecret: "pi_test_default_secret",
      amount: 2500,
      currency: "usd",
      provider: "stripe"
    });
  } finally {
    mock.restore();
  }
});

test("createPaymentIntent forwards explicit currency and metadata", async () => {
  const mock = mockStripeCreate(async (params) => ({
    id: "pi_test_meta",
    client_secret: "pi_test_meta_secret",
    amount: params.amount,
    currency: params.currency
  }));

  try {
    const result = await createPaymentIntent({
      amount: 1999,
      currency: "EUR",
      metadata: { jobId: "job_123" }
    });

    assert.deepEqual(
      mock.calls.map((call) => call.params),
      [{ amount: 1999, currency: "eur", metadata: { jobId: "job_123" } }]
    );
    assert.equal(result.clientSecret, "pi_test_meta_secret");
    assert.equal(result.paymentId, "pi_test_meta");
  } finally {
    mock.restore();
  }
});

test("createPaymentIntent rejects missing or invalid amounts before calling Stripe", async () => {
  const mock = mockStripeCreate(async () => {
    throw new Error("Stripe must not be called for invalid payloads");
  });

  try {
    const invalidPayloads = [
      {},
      { amount: 0 },
      { amount: -100 },
      { amount: 12.5 },
      { amount: "100" },
      { amount: Number.NaN }
    ];

    for (const payload of invalidPayloads) {
      await assert.rejects(
        () => createPaymentIntent(payload),
        /amount is required and must be a positive integer/
      );
    }

    assert.equal(mock.calls.length, 0);
  } finally {
    mock.restore();
  }
});

test("createPaymentIntent validates optional metadata", async () => {
  const mock = mockStripeCreate(async () => {
    throw new Error("Stripe must not be called for invalid payloads");
  });

  try {
    await assert.rejects(
      () => createPaymentIntent({ amount: 500, metadata: "not-an-object" }),
      /metadata must be an object/
    );
    assert.equal(mock.calls.length, 0);
  } finally {
    mock.restore();
  }
});

test("createPaymentIntent re-throws Stripe errors with the original message", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.type = "StripeCardError";
  stripeError.statusCode = 402;

  const mock = mockStripeCreate(async () => {
    throw stripeError;
  });

  try {
    await assert.rejects(
      () => createPaymentIntent({ amount: 500 }),
      (error) => {
        assert.equal(error.message, "Your card was declined.");
        assert.equal(error.type, "StripeCardError");
        assert.equal(error.statusCode, 402);
        return true;
      }
    );
  } finally {
    mock.restore();
  }
});

// Smoke test against the real Stripe test API. Guarded so normal CI never
// performs network calls. Run with STRIPE_INTEGRATION_TEST=1 and a test key.
test(
  "creates a test-mode PaymentIntent against the Stripe API",
  { skip: process.env.STRIPE_INTEGRATION_TEST !== "1" },
  async () => {
    const result = await createPaymentIntent({ amount: 1000, currency: "usd" });
    assert.match(result.paymentId, /^pi_/);
    assert.ok(result.clientSecret);
  }
);

// Runs last in this file: it clears both configured sources and does not
// restore them, so nothing may be defined after it that needs a key.
// Node runs each test file in its own process, so clearing here cannot
// leak into other files.
test("getStripeClient throws a descriptive error when STRIPE_SECRET_KEY is missing", () => {
  delete process.env.STRIPE_SECRET_KEY;
  env.stripeSecretKey = "";
  assert.throws(() => getStripeClient(), /STRIPE_SECRET_KEY is not configured/);
});
