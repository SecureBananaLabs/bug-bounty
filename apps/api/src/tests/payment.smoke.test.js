/**
 * Smoke test for Stripe payment integration.
 *
 * Requires a valid STRIPE_SECRET_KEY (test mode) in the environment.
 * Set RUN_SMOKE_TESTS=true to enable this test.
 */
import { describe, it } from "node:test";
import assert from "node:assert";

const RUN_SMOKE = process.env.RUN_SMOKE_TESTS === "true";

describe("Stripe Payment — smoke test", { skip: !RUN_SMOKE }, () => {
  it("creates a real test-mode PaymentIntent", async () => {
    const { createPaymentIntent } = await import("../services/paymentService.js");
    const result = await createPaymentIntent({ amount: 100, currency: "usd" });

    assert.ok(result.paymentId.startsWith("pi_"), "Expected Stripe PaymentIntent ID");
    assert.ok(result.clientSecret.startsWith("pi_"));
    assert.ok(result.clientSecret.includes("_secret_"));
  });
});
