import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const runSmoke = process.env.RUN_STRIPE_PAYMENT_SMOKE === "1";

test(
  "creates a live Stripe test-mode PaymentIntent when smoke testing is enabled",
  { skip: runSmoke ? false : "set RUN_STRIPE_PAYMENT_SMOKE=1 and STRIPE_SECRET_KEY=sk_test_... to run" },
  async () => {
    assert.match(process.env.STRIPE_SECRET_KEY ?? "", /^sk_test_/, "smoke test requires a Stripe test secret");

    const payment = await createPaymentIntent({
      amount: 50,
      currency: "usd",
      metadata: {
        source: "freelanceflow-api-smoke"
      }
    });

    assert.match(payment.paymentId, /^pi_/);
    assert.match(payment.clientSecret, /^pi_.*_secret_/);
    assert.equal(payment.amount, 50);
    assert.equal(payment.currency, "usd");
    assert.equal(payment.provider, "stripe");
  }
);
