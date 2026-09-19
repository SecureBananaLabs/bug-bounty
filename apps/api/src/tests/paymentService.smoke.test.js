/**
 * Smoke test for Stripe PaymentIntent creation.
 *
 * This test is GUARDED by the RUN_STRIPE_SMOKE environment flag
 * because it makes real API calls against Stripe's test mode.
 *
 * Prerequisites:
 *   STRIPE_SECRET_KEY=sk_test_...  (Stripe test-mode secret key)
 *   RUN_STRIPE_SMOKE=1             (opt-in flag)
 *
 * Usage:
 *   RUN_STRIPE_SMOKE=1 STRIPE_SECRET_KEY=sk_test_... node --test src/tests/paymentService.smoke.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const shouldRun = process.env.RUN_STRIPE_SMOKE === "1";

test(
  "smoke: creates a real Stripe PaymentIntent in test mode",
  { skip: !shouldRun, todo: false },
  async () => {
    const result = await createPaymentIntent({
      amount: 1099, // $10.99
      currency: "usd",
      metadata: { order_id: "test-order-001", source: "smoke_test" },
    });

    assert.ok(typeof result.paymentId === "string");
    assert.match(result.paymentId, /^pi_/);
    assert.ok(typeof result.clientSecret === "string");
    assert.match(result.clientSecret, /^pi_.*_secret_/);
    assert.equal(result.amount, 1099);
    assert.equal(result.currency, "usd");
  }
);

test(
  "smoke: defaults currency to usd",
  { skip: !shouldRun },
  async () => {
    const result = await createPaymentIntent({
      amount: 500, // $5.00
    });

    assert.equal(result.currency, "usd");
    assert.equal(result.amount, 500);
    assert.match(result.paymentId, /^pi_/);
  }
);

test(
  "smoke: creates payment with zero metadata",
  { skip: !shouldRun },
  async () => {
    const result = await createPaymentIntent({
      amount: 2000, // $20.00
      currency: "eur",
    });

    assert.equal(result.currency, "eur");
    assert.equal(result.amount, 2000);
    assert.match(result.paymentId, /^pi_/);
  }
);
