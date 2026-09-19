import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, setStripeClientForTesting } from "../services/paymentService.js";

test("creates a real Stripe test-mode PaymentIntent when explicitly enabled", { skip: process.env.RUN_STRIPE_SMOKE_TEST !== "1" }, async () => {
  setStripeClientForTesting(undefined);

  const result = await createPaymentIntent({
    amount: 50,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
  assert.equal(result.amount, 50);
  assert.equal(result.currency, "usd");
});
