import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const shouldRunSmokeTest =
  process.env.RUN_STRIPE_SMOKE_TEST === "true" && Boolean(process.env.STRIPE_SECRET_KEY);

test("createPaymentIntent creates a Stripe test-mode PaymentIntent when smoke testing is enabled", {
  skip: shouldRunSmokeTest ? false : "Set RUN_STRIPE_SMOKE_TEST=true and STRIPE_SECRET_KEY to run live Stripe smoke test"
}, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smokeTest: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
