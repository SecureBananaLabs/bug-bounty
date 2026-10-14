import { createPaymentIntent } from "./paymentService.js";

describe("Proposal Billing Positive Pricing Requirement (#11604)", () => {
  it("should reject negative or zero payment amounts", async () => {
    await expect(createPaymentIntent({ amount: -50 })).rejects.toThrow();
    await expect(createPaymentIntent({ amount: 0 })).rejects.toThrow();
  });

  it("should accept valid positive payment amount", async () => {
    const res = await createPaymentIntent({ amount: 100, currency: "usd" });
    expect(res.paymentId).toBeDefined();
    expect(res.amount).toBe(100);
  });
});
