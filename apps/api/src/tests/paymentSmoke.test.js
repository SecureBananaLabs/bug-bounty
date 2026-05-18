import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test(
  "creates a real Stripe test-mode PaymentIntent when smoke testing is enabled",
  { skip: !process.env.RUN_STRIPE_SMOKE || !process.env.STRIPE_SECRET_KEY },
  async () => {
    const result = await createPaymentIntent({
      amount: Number(process.env.STRIPE_SMOKE_AMOUNT ?? 100),
      currency: process.env.STRIPE_SMOKE_CURRENCY ?? "usd",
      metadata: {
        smoke: "true",
        source: "freelanceflow-api-test"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
    assert.equal(result.provider, "stripe");
  }
);
