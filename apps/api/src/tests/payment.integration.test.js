import test from "node:test";
import assert from "node:assert/strict";

if (!process.env.STRIPE_SECRET_KEY) {
  test("smoke test against Stripe API — skipped (no STRIPE_SECRET_KEY set)", () => {
    assert.ok(true);
  });
} else {
  test("smoke test: creates real PaymentIntent against Stripe", async () => {
    const { createPaymentIntent } = await import("../services/paymentService.js");
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd"
    });

    assert.ok(result.paymentId.startsWith("pi_"));
    assert.ok(result.clientSecret);
    assert.ok(result.clientSecret.includes("_secret_"));
  });
}
