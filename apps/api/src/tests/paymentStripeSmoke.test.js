import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const shouldRunSmoke = process.env.STRIPE_PAYMENT_SMOKE === "true" && Boolean(process.env.STRIPE_SECRET_KEY);

test("creates a Stripe test-mode PaymentIntent", { skip: shouldRunSmoke ? false : "Set STRIPE_PAYMENT_SMOKE=true and STRIPE_SECRET_KEY to run live Stripe smoke test" }, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      source: "api-smoke-test"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
});
