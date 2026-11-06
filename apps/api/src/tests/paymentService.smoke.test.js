import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent can create a Stripe test-mode PaymentIntent", { skip: !process.env.RUN_STRIPE_SMOKE_TEST }, async () => {
  assert.match(
    process.env.STRIPE_SECRET_KEY ?? "",
    /^sk_test_/,
    "RUN_STRIPE_SMOKE_TEST requires a Stripe test-mode secret key."
  );

  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      source: "api-smoke-test"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.+_secret_.+/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
