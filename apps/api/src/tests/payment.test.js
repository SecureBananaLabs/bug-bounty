import { describe, it, expect, vi, beforeEach } from "vitest";

describe("createPaymentIntent", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("should throw if amount is missing", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await expect(createPaymentIntent({ currency: "usd" })).rejects.toThrow(
      "amount is required and must be a positive integer"
    );
  });

  it("should throw if amount is not an integer", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await expect(createPaymentIntent({ amount: 10.5, currency: "usd" })).rejects.toThrow(
      "amount is required and must be a positive integer"
    );
  });

  it("should throw if amount is zero", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await expect(createPaymentIntent({ amount: 0, currency: "usd" })).rejects.toThrow(
      "amount is required and must be a positive integer"
    );
  });

  it("should throw if STRIPE_SECRET_KEY is not set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await expect(createPaymentIntent({ amount: 2000, currency: "usd" })).rejects.toThrow(
      "STRIPE_SECRET_KEY environment variable is not set"
    );
  });
});
