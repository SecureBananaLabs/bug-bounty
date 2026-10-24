import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const shouldRunStripeSmokeTest =
  process.env.RUN_STRIPE_SMOKE_TEST === "true" && Boolean(process.env.STRIPE_SECRET_KEY);

test(
  "createPaymentIntent can create a real Stripe PaymentIntent when explicitly enabled",
  { skip: !shouldRunStripeSmokeTest },
  async () => {
    const result = await createPaymentIntent({
      amount: Number(process.env.STRIPE_SMOKE_AMOUNT ?? 100),
      currency: process.env.STRIPE_SMOKE_CURRENCY ?? "usd",
      metadata: {
        source: "paymentService.smoke.test"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.equal(typeof result.clientSecret, "string");
    assert.equal(result.provider, "stripe");
  }
);
