import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, setStripeClientForTests } from "../services/paymentService.js";

test("creates a real Stripe test-mode payment intent when explicitly enabled", { skip: process.env.RUN_STRIPE_SMOKE_TEST !== "1" }, async () => {
  setStripeClientForTests(undefined);

  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_/);
});
