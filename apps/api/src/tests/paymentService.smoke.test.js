import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent can create a real Stripe test-mode PaymentIntent", async (t) => {
  if (process.env.RUN_STRIPE_SMOKE_TEST !== "1") {
    t.skip("Set RUN_STRIPE_SMOKE_TEST=1 and STRIPE_SECRET_KEY to run this smoke test.");
    return;
  }

  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.equal(typeof result.clientSecret, "string");
  assert.equal(result.provider, "stripe");
});
