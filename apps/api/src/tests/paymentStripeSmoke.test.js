import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const canRunStripeSmoke =
  process.env.STRIPE_SMOKE_TEST === "1" && process.env.STRIPE_SECRET_KEY;

test(
  "creates a real Stripe test-mode PaymentIntent when explicitly enabled",
  { skip: canRunStripeSmoke ? false : "set STRIPE_SMOKE_TEST=1 and STRIPE_SECRET_KEY to run" },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        source: "securebanana-smoke-test"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.+_secret_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  }
);
