import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

process.env.STRIPE_SECRET_KEY = "sk_test_mock_key_for_unit_tests";

const { createPaymentIntent, PaymentError, mapStripeError, _resetStripe } = await import(
  "../services/paymentService.js"
);

/** Create a mock Stripe client for testing */
function mockStripe(overrides = {}) {
  const calls = [];
  const create = async (params) => {
    calls.push(params);
    if (overrides.createError) throw overrides.createError;
    return {
      id: "pi_test_123",
      client_secret: "cs_test_456",
      amount: params.amount,
      currency: params.currency,
    };
  };
  return { paymentIntents: { create }, calls };
}

beforeEach(() => {
  _resetStripe();
});

describe("createPaymentIntent - validation", () => {
  it("should reject missing amount", async () => {
    await assert.rejects(() => createPaymentIntent({}), {
      message: "amount is required",
    });
  });

  it("should reject non-positive amount", async () => {
    await assert.rejects(() => createPaymentIntent({ amount: -5 }), {
      message: /positive integer/,
    });
  });

  it("should reject non-integer amount", async () => {
    await assert.rejects(() => createPaymentIntent({ amount: 10.5 }), {
      message: /positive integer/,
    });
  });

  it("should reject zero amount", async () => {
    await assert.rejects(() => createPaymentIntent({ amount: 0 }), {
      message: /positive integer/,
    });
  });

  it("should reject invalid currency format", async () => {
    await assert.rejects(() => createPaymentIntent({ amount: 100, currency: "US" }), {
      message: "currency must be a 3-letter ISO code",
    });
  });

  it("should accept uppercase currency and normalize to lowercase", async () => {
    const stripe = mockStripe();
    const result = await createPaymentIntent({ amount: 2000, currency: "USD" }, { stripe });
    assert.equal(result.currency, "usd");
    assert.deepEqual(stripe.calls[0].amount, 2000);
    assert.equal(stripe.calls[0].currency, "usd");
  });
});

describe("createPaymentIntent - success", () => {
  it("should call Stripe with correct params and return result", async () => {
    const stripe = mockStripe();
    const result = await createPaymentIntent({ amount: 2000, currency: "usd" }, { stripe });

    assert.equal(stripe.calls.length, 1);
    assert.equal(stripe.calls[0].amount, 2000);
    assert.equal(stripe.calls[0].currency, "usd");

    assert.equal(result.paymentId, "pi_test_123");
    assert.equal(result.clientSecret, "cs_test_456");
    assert.equal(result.amount, 2000);
    assert.equal(result.currency, "usd");
  });

  it("should default currency to usd", async () => {
    const stripe = mockStripe();
    const result = await createPaymentIntent({ amount: 500 }, { stripe });
    assert.equal(result.currency, "usd");
    assert.equal(stripe.calls[0].currency, "usd");
  });

  it("should pass metadata to Stripe", async () => {
    const stripe = mockStripe();
    await createPaymentIntent({ amount: 500, metadata: { orderId: "abc" } }, { stripe });
    assert.deepEqual(stripe.calls[0].metadata, { orderId: "abc" });
  });
});

describe("createPaymentIntent - missing STRIPE_SECRET_KEY", () => {
  it("should throw PaymentError when STRIPE_SECRET_KEY is missing and no deps provided", async () => {
    _resetStripe();
    delete process.env.STRIPE_SECRET_KEY;
    await assert.rejects(() => createPaymentIntent({ amount: 500 }), {
      message: "STRIPE_SECRET_KEY environment variable is required",
    });
    process.env.STRIPE_SECRET_KEY = "sk_test_mock_key_for_unit_tests";
  });
});

describe("PaymentError", () => {
  it("should set statusCode and message", () => {
    const err = new PaymentError("bad input", 422);
    assert.equal(err.message, "bad input");
    assert.equal(err.statusCode, 422);
    assert.equal(err.name, "PaymentError");
  });
});

describe("mapStripeError", () => {
  it("should pass through PaymentError", () => {
    const err = new PaymentError("custom", 400);
    const mapped = mapStripeError(err);
    assert.equal(mapped.message, "custom");
    assert.equal(mapped.statusCode, 400);
  });

  it("should map StripeCardError to 402", () => {
    const err = { type: "StripeCardError", message: "card declined" };
    const mapped = mapStripeError(err);
    assert.equal(mapped.statusCode, 402);
    assert.equal(mapped.message, "card declined");
  });

  it("should map StripeInvalidRequestError to 400", () => {
    const err = { type: "StripeInvalidRequestError", message: "invalid amount" };
    const mapped = mapStripeError(err);
    assert.equal(mapped.statusCode, 400);
    assert.equal(mapped.message, "invalid amount");
  });

  it("should map StripeAuthenticationError to 401", () => {
    const err = { type: "StripeAuthenticationError", message: "invalid key" };
    const mapped = mapStripeError(err);
    assert.equal(mapped.statusCode, 401);
  });

  it("should map StripeRateLimitError to 429", () => {
    const err = { type: "StripeRateLimitError", message: "too many requests" };
    const mapped = mapStripeError(err);
    assert.equal(mapped.statusCode, 429);
  });

  it("should map unknown errors to 500", () => {
    const err = new Error("something broke");
    const mapped = mapStripeError(err);
    assert.equal(mapped.statusCode, 500);
  });
});