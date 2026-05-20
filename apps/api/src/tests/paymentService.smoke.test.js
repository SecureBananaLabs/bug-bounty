import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const shouldRunStripeSmoke =
  process.env.RUN_STRIPE_SMOKE_TEST === "1" && Boolean(process.env.STRIPE_SECRET_KEY);

test("createPaymentIntent can create a test-mode Stripe PaymentIntent", { skip: !shouldRunStripeSmoke }, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      smoke: true,
      source: "freelanceflow-api-test"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
