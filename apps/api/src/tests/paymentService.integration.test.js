import test from "node:test";
import assert from "node:assert/strict";

// Integration/smoke test for paymentService
// Run with RUN_STRIPE_SMOKE_TEST=true to test against real Stripe API

test("createPaymentIntent smoke test with real Stripe API", { skip: !process.env.RUN_STRIPE_SMOKE_TEST }, async () => {
  // Only run when explicitly enabled with RUN_STRIPE_SMOKE_TEST env flag
  const { createPaymentIntent } = await import("../services/paymentService.js");

  const result = await createPaymentIntent({
    amount: 1000, // $10.00 in cents
    currency: "usd"
  });

  assert.ok(result.paymentId, "paymentId should be present");
  assert.ok(result.paymentId.startsWith("pi_"), "paymentId should start with pi_");
  assert.ok(result.clientSecret, "clientSecret should be present");
  assert.ok(result.clientSecret.includes("_secret_"), "clientSecret should contain _secret_");
  assert.equal(result.amount, 1000);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
