import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const shouldRunStripeSmokeTest =
  process.env.RUN_STRIPE_SMOKE_TEST === "1" &&
  typeof process.env.STRIPE_SECRET_KEY === "string" &&
  process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");

test(
  "createPaymentIntent creates a test-mode Stripe PaymentIntent",
  { skip: shouldRunStripeSmokeTest ? false : "Set RUN_STRIPE_SMOKE_TEST=1 with a sk_test_ STRIPE_SECRET_KEY" },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        source: "api-smoke-test"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  }
);
