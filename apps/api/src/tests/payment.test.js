import { describe, it, mock } from "node:test";
import assert from "node:assert";

// Mock Stripe before importing
const mockPaymentIntents = {
  create: mock.fn(),
};

mock.module("stripe", {
  default: function () {
    return { paymentIntents: mockPaymentIntents };
  },
});

const { createPaymentIntent } = await import("../services/paymentService.js");

// Temporarily set key so Stripe is initialized
process.env.STRIPE_SECRET_KEY = "sk_test_mock";

describe("createPaymentIntent", () => {
  beforeEach(() => {
    mockPaymentIntents.create.mock.resetCalls();
  });

  it("creates a payment intent with valid payload", async () => {
    mockPaymentIntents.create.mock.mockImplementationOnce(() =>
      Promise.resolve({
        id: "pi_mock_123",
        client_secret: "pi_mock_123_secret_abc",
        amount: 2000,
        currency: "usd",
      })
    );

    const result = await createPaymentIntent({ amount: 2000, currency: "usd" });

    assert.strictEqual(result.paymentId, "pi_mock_123");
    assert.strictEqual(result.clientSecret, "pi_mock_123_secret_abc");
    assert.strictEqual(result.amount, 2000);
    assert.strictEqual(result.currency, "usd");
    assert.strictEqual(mockPaymentIntents.create.mock.calls.length, 1);

    const callArgs = mockPaymentIntents.create.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.amount, 2000);
    assert.strictEqual(callArgs.currency, "usd");
  });

  it("defaults to usd currency", async () => {
    mockPaymentIntents.create.mock.mockImplementationOnce(() =>
      Promise.resolve({
        id: "pi_mock_456",
        client_secret: "secret_xyz",
        amount: 1000,
        currency: "usd",
      })
    );

    await createPaymentIntent({ amount: 1000 });
    const callArgs = mockPaymentIntents.create.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.currency, "usd");
  });

  it("rejects non-integer amount", async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 10.5 }),
      { code: "INVALID_AMOUNT" }
    );
    assert.strictEqual(mockPaymentIntents.create.mock.calls.length, 0);
  });

  it("rejects zero or negative amount", async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 0 }),
      { code: "INVALID_AMOUNT" }
    );
    await assert.rejects(
      () => createPaymentIntent({ amount: -100 }),
      { code: "INVALID_AMOUNT" }
    );
  });

  it("rejects missing amount", async () => {
    await assert.rejects(
      () => createPaymentIntent({}),
      { code: "INVALID_AMOUNT" }
    );
  });
});
