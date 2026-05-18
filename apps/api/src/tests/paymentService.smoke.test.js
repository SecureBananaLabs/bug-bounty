import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("creates a Stripe test-mode PaymentIntent when smoke tests are enabled", {
  skip: process.env.RUN_STRIPE_SMOKE === "true" ? false : "Set RUN_STRIPE_SMOKE=true to run Stripe API smoke test"
}, async () => {
  assert.ok(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY must be set for the smoke test");

  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      source: "api-smoke-test"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
