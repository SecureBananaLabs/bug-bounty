import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

const mockCreate = jest.fn();

jest.unstable_mockModule("stripe", () => ({
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: { create: mockCreate },
  })),
}));

const { createPaymentIntent } = await import("./createPaymentIntent.js");

describe("createPaymentIntent", () => {
  const prevKey = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    mockCreate.mockReset();
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = prevKey;
  });

  it("requires a positive integer amount", async () => {
    await expect(createPaymentIntent({})).rejects.toThrow(/amount is required/i);
    await expect(createPaymentIntent({ amount: 0 })).rejects.toThrow(/positive integer/i);
    await expect(createPaymentIntent({ amount: -5 })).rejects.toThrow(/positive integer/i);
    await expect(createPaymentIntent({ amount: 1.5 })).rejects.toThrow(/positive integer/i);
  });

  it("calls stripe.paymentIntents.create with amount and default currency", async () => {
    mockCreate.mockResolvedValue({
      id: "pi_test_123",
      client_secret: "pi_test_123_secret_abc",
      amount: 2500,
      currency: "usd",
    });

    const result = await createPaymentIntent({ amount: 2500 });

    expect(mockCreate).toHaveBeenCalledWith({ amount: 2500, currency: "usd" });
    expect(result).toEqual({
      paymentId: "pi_test_123",
      clientSecret: "pi_test_123_secret_abc",
      amount: 2500,
      currency: "usd",
      provider: "stripe",
    });
  });

  it("passes custom currency and metadata", async () => {
    mockCreate.mockResolvedValue({
      id: "pi_eur",
      client_secret: "sec",
      amount: 100,
      currency: "eur",
    });

    await createPaymentIntent({
      amount: 100,
      currency: "eur",
      metadata: { orderId: "ord_1" },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      amount: 100,
      currency: "eur",
      metadata: { orderId: "ord_1" },
    });
  });

  it("re-throws Stripe errors with original message", async () => {
    const err = new Error("Invalid currency");
    err.type = "StripeInvalidRequestError";
    mockCreate.mockRejectedValue(err);
    await expect(createPaymentIntent({ amount: 100 })).rejects.toThrow("Invalid currency");
  });

  it("smoke: creates a test-mode PaymentIntent when RUN_STRIPE_SMOKE=1", async () => {
    if (process.env.RUN_STRIPE_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test")) {
      return;
    }
    jest.resetModules();
    const { createPaymentIntent: live } = await import("./createPaymentIntent.js");
    const result = await live({ amount: 50, currency: "usd" });
    expect(result.paymentId).toMatch(/^pi_/);
    expect(result.clientSecret).toBeTruthy();
  });
});
