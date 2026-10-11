import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("guarded Stripe smoke test creates a test-mode PaymentIntent", { skip: process.env.STRIPE_SMOKE_TEST !== "1" }, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_/);
});
