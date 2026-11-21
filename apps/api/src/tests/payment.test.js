import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";

// Mock Stripe before importing the module under test
const mockCreate = mock.fn();
mock.module("stripe", {
  default: mock.fn(() => ({
    paymentIntents: {
      create: mockCreate,
    },
  })),
});

// Dynamically import after mock is set up
const { createPaymentIntent } = await import("../services/paymentService.js");

describe("createPaymentIntent", () => {
  beforeEach(() => {
    mockCreate.mock.resetCalls();
    mockCreate.mock.mockImplementation(async (params) => ({
      id: "pi_test_123",
      client_secret: "pi_test_123_secret_abc",
      amount: params.amount,
      currency: params.currency,
    }));
  });

  it("rejects when amount is missing", async () => {
    await assert.rejects(
      () => createPaymentIntent({}),
      /Missing required field: amount/
    );
  });

  it("rejects when amount is not a positive integer", async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: -100 }),
      /amount must be a positive integer/
    );
    await assert.rejects(
      () => createPaymentIntent({ amount: 10.5 }),
      /amount must be a positive integer/
    );
    await assert.rejects(
      () => createPaymentIntent({ amount: 0 }),
      /amount must be a positive integer/
    );
  });

  it("defaults currency to usd", async () => {
    const result = await createPaymentIntent({ amount: 5000 });
    assert.equal(result.paymentId, "pi_test_123");
    assert.equal(result.clientSecret, "pi_test_123_secret_abc");

    const callArgs = mockCreate.mock.calls[0]?.arguments[0];
    assert.equal(callArgs.currency, "usd");
  });

  it("passes amount and currency to Stripe", async () => {
    const result = await createPaymentIntent({ amount: 2500, currency: "eur" });
    assert.equal(result.paymentId, "pi_test_123");

    const callArgs = mockCreate.mock.calls[0]?.arguments[0];
    assert.equal(callArgs.amount, 2500);
    assert.equal(callArgs.currency, "eur");
  });

  it("passes metadata to Stripe when provided", async () => {
    const metadata = { orderId: "order-001", source: "benchmark" };
    await createPaymentIntent({ amount: 1000, metadata });

    const callArgs = mockCreate.mock.calls[0]?.arguments[0];
    assert.deepEqual(callArgs.metadata, metadata);
  });

  it("returns clientSecret and paymentId from Stripe response", async () => {
    const result = await createPaymentIntent({ amount: 999 });
    assert.ok(result.clientSecret);
    assert.ok(result.paymentId);
    assert.ok(!result.paymentId.startsWith("pay_")); // stub is removed
  });

  it("re-throws Stripe errors with original message", async () => {
    mockCreate.mock.mockImplementationOnce(async () => {
      throw new Error("Your card was declined.");
    });

    await assert.rejects(
      () => createPaymentIntent({ amount: 100 }),
      /Your card was declined./
    );
  });
});
