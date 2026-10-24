import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const shouldRunSmokeTest =
  process.env.RUN_STRIPE_SMOKE_TEST === "1" && Boolean(process.env.STRIPE_SECRET_KEY);

test(
  "createPaymentIntent creates a test-mode Stripe PaymentIntent when smoke tests are enabled",
  { skip: !shouldRunSmokeTest },
  async () => {
    const result = await createPaymentIntent({
      amount: 1234,
      currency: "usd",
      metadata: {
        suite: "smoke"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.equal(typeof result.clientSecret, "string");
    assert.ok(result.clientSecret.length > 0);
    assert.equal(result.amount, 1234);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  }
);
