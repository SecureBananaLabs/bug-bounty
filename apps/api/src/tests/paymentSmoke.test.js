import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("creates a real Stripe test-mode PaymentIntent when explicitly enabled", { skip: process.env.STRIPE_LIVE_SMOKE !== "true" }, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
});
