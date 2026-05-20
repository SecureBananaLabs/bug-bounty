import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// --- Mock Stripe SDK before importing the service ---
const createdIntents = [];

const mockPaymentIntents = {
  create: async (params) => {
    createdIntents.push(params);
    return {
      id: `pi_test_${Date.now()}`,
      client_secret: `cs_test_${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
    };
  },
};

const mockStripe = {
  paymentIntents: mockPaymentIntents,
  __createdIntents: createdIntents,
};

// Inject mock via import chain
const { createPaymentIntent, PaymentError, mapStripeError } = await import(
  "../services/paymentService.js?mock=" + Date.now()
);

// We need to rewire the Stripe module — since ESM doesn't have easy mocking,
// we'll test the service logic by importing it with a test env var.
// The service reads STRIPE_SECRET_KEY from env, so we set it.
process.env.STRIPE_SECRET_KEY = "sk_test_mock_key_for_unit_tests";

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

  it("should map unknown errors to 500", () => {
    const err = new Error("something broke");
    const mapped = mapStripeError(err);
    assert.equal(mapped.statusCode, 500);
  });
});