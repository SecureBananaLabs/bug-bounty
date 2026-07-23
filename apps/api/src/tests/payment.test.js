import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createPaymentIntent } from "../services/paymentService.js";

// Helper to mock Stripe paymentIntents.create
function mockStripe(mockFn) {
  Object.defineProperty(Stripe.prototype, 'paymentIntents', {
    get() {
      return {
        create: mockFn
      };
    },
    set(val) {
      // Ignore Stripe's attempt to overwrite
    },
    configurable: true
  });
  return () => {
    delete Stripe.prototype.paymentIntents;
  };
}

test("Unit Test: createPaymentIntent passes correct args to Stripe SDK", async () => {
  let passedArgs = null;
  const restore = mockStripe(async (args) => {
    passedArgs = args;
    return {
      id: "pi_test_123",
      client_secret: "seti_test_secret_123",
      amount: args.amount,
      currency: args.currency
    };
  });

  // Set env
  const originalKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  try {
    const result = await createPaymentIntent({
      amount: 2500,
      currency: "eur"
    });

    assert.deepEqual(passedArgs, { amount: 2500, currency: "eur" });
    assert.deepEqual(result, {
      paymentId: "pi_test_123",
      clientSecret: "seti_test_secret_123",
      amount: 2500,
      currency: "eur",
      provider: "stripe"
    });
  } finally {
    restore();
    process.env.STRIPE_SECRET_KEY = originalKey;
  }
});

test("Unit Test: createPaymentIntent defaults currency to usd", async () => {
  let passedArgs = null;
  const restore = mockStripe(async (args) => {
    passedArgs = args;
    return {
      id: "pi_test_456",
      client_secret: "seti_test_secret_456",
      amount: args.amount,
      currency: args.currency
    };
  });

  const originalKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  try {
    const result = await createPaymentIntent({
      amount: 1000
    });

    assert.equal(passedArgs.currency, "usd");
    assert.equal(result.currency, "usd");
  } finally {
    restore();
    process.env.STRIPE_SECRET_KEY = originalKey;
  }
});

test("Unit Test: createPaymentIntent throws on missing/invalid amount", async () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  try {
    // Missing payload/amount
    await assert.rejects(
      createPaymentIntent({}),
      /Amount is required/
    );

    // Negative amount
    await assert.rejects(
      createPaymentIntent({ amount: -50 }),
      /Amount must be a positive integer/
    );

    // Non-integer amount
    await assert.rejects(
      createPaymentIntent({ amount: 10.5 }),
      /Amount must be a positive integer/
    );
  } finally {
    process.env.STRIPE_SECRET_KEY = originalKey;
  }
});

test("Unit Test: createPaymentIntent throws on missing Stripe configuration key", async () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;

  try {
    await assert.rejects(
      createPaymentIntent({ amount: 1000 }),
      /STRIPE_SECRET_KEY environment variable is not configured/
    );
  } finally {
    process.env.STRIPE_SECRET_KEY = originalKey;
  }
});

test("Unit Test: createPaymentIntent propagates Stripe API errors", async () => {
  const stripeError = new Error("Card declined");
  stripeError.type = "StripeCardError";
  stripeError.code = "card_declined";

  const restore = mockStripe(async () => {
    throw stripeError;
  });

  const originalKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  try {
    await assert.rejects(
      createPaymentIntent({ amount: 1000 }),
      (err) => {
        assert.equal(err.message, "Card declined");
        assert.equal(err.type, "StripeCardError");
        assert.equal(err.code, "card_declined");
        return true;
      }
    );
  } finally {
    restore();
    process.env.STRIPE_SECRET_KEY = originalKey;
  }
});

// Integration Test (Guarded by env flag)
test("Integration Test: Stripe real API PaymentIntent creation", { skip: process.env.RUN_STRIPE_INTEGRATION_TESTS !== "true" }, async () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    assert.fail("STRIPE_SECRET_KEY is required for integration tests");
  }

  const result = await createPaymentIntent({
    amount: 1500,
    currency: "usd"
  });

  assert.ok(result.paymentId.startsWith("pi_"));
  assert.ok(result.clientSecret.startsWith("pi_"));
  assert.equal(result.amount, 1500);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
