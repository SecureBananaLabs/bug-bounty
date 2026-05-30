import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const runStripeSmoke = process.env.RUN_STRIPE_SMOKE_TEST === "1" && Boolean(process.env.STRIPE_SECRET_KEY);

test("creates a live Stripe PaymentIntent when smoke credentials are provided", {
  skip: runStripeSmoke ? false : "Set RUN_STRIPE_SMOKE_TEST=1 and STRIPE_SECRET_KEY to run the live Stripe smoke test"
}, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      source: "freelanceflow-api-smoke"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
