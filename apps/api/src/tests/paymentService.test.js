import { jest } from "@jest/globals";

// Mock the Stripe SDK before importing paymentService
const mockCreate = jest.fn();
jest.mock("stripe", () =>
  jest.fn(() => ({
    paymentIntents: { create: mockCreate },
  }))
);

process.env.STRIPE_SECRET_KEY = "sk_test_mock";

const { createPaymentIntent } = await import("../services/paymentService.js");

describe("createPaymentIntent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls stripe.paymentIntents.create with correct args", async () => {
    mockCreate.mockResolvedValue({
      id: "pi_test_123",
      client_secret: "pi_test_123_secret_abc",
      amount: 1000,
      currency: "usd",
    });

    const result = await createPaymentIntent({ amount: 1000, currency: "usd" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1000, currency: "usd" })
    );
    expect(result.clientSecret).toBe("pi_test_123_secret_abc");
    expect(result.paymentId).toBe("pi_test_123");
    expect(result.provider).toBe("stripe");
  });

  it("defaults currency to usd", async () => {
    mockCreate.mockResolvedValue({
      id: "pi_test_456", client_secret: "secret", amount: 500, currency: "usd",
    });
    await createPaymentIntent({ amount: 500 });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ currency: "usd" }));
  });

  it("throws if amount is missing", async () => {
    await expect(createPaymentIntent({})).rejects.toThrow("payload.amount is required");
  });

  it("throws if amount is not a positive integer", async () => {
    await expect(createPaymentIntent({ amount: -50 })).rejects.toThrow("positive integer");
    await expect(createPaymentIntent({ amount: 9.99 })).rejects.toThrow("positive integer");
  });

  it("re-throws Stripe errors with type preserved", async () => {
    const stripeErr = new Error("No such payment method");
    stripeErr.type = "StripeInvalidRequestError";
    mockCreate.mockRejectedValue(stripeErr);
    await expect(createPaymentIntent({ amount: 100 })).rejects.toThrow(
      "Stripe error (StripeInvalidRequestError)"
    );
  });
});

// Integration smoke test — only runs if STRIPE_SMOKE_TEST=1 and real key set
if (process.env.STRIPE_SMOKE_TEST === "1" && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  describe("smoke: real Stripe API (test mode)", () => {
    it("creates a real PaymentIntent", async () => {
      const result = await createPaymentIntent({ amount: 100, currency: "usd" });
      expect(result.paymentId).toMatch(/^pi_/);
      expect(result.clientSecret).toContain("_secret_");
    }, 15000);
  });
}
