import assert from "node:assert/strict";
import test from "node:test";
import { createPaymentIntent } from "../services/paymentService.js";

const shouldRunSmokeTest = process.env.RUN_STRIPE_SMOKE_TEST === "1" && Boolean(process.env.STRIPE_SECRET_KEY);

test(
  "creates a Stripe payment intent against the Stripe test API",
  { skip: shouldRunSmokeTest ? false : "Set RUN_STRIPE_SMOKE_TEST=1 and STRIPE_SECRET_KEY to run this smoke test" },
  async () => {
    assert.match(process.env.STRIPE_SECRET_KEY, /^sk_test_/, "Use a Stripe test key for smoke testing");

    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { source: "securebanana-bounty-smoke-test" },
      idempotencyKey: "securebanana-bounty-smoke-test"
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /_secret_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
  }
);
