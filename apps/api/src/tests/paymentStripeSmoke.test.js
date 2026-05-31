import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const smokeEnabled = process.env.RUN_STRIPE_SMOKE_TEST === "1";

test("Stripe smoke test is guarded unless explicitly enabled", () => {
  if (!smokeEnabled) {
    assert.notEqual(process.env.RUN_STRIPE_SMOKE_TEST, "1");
    return;
  }

  assert.ok(
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"),
    "STRIPE_SECRET_KEY must be a Stripe test-mode key when RUN_STRIPE_SMOKE_TEST=1"
  );
});

if (smokeEnabled) {
  test("creates a real Stripe test-mode PaymentIntent when explicitly enabled", async () => {
    if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
      throw new Error("STRIPE_SECRET_KEY must be a Stripe test-mode key for the smoke test");
    }

    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        source: "securebanana-payment-smoke"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.+_secret_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  });
}
