import test from "node:test";
import assert from "node:assert/strict";

import {
  createPaymentIntent,
} from "../services/paymentService.js";


const smokeEnabled =
  process.env.RUN_STRIPE_SMOKE_TEST
  === "1";

const secretKey =
  process.env.STRIPE_SECRET_KEY;


if (!smokeEnabled) {
  test(
    "Stripe PaymentIntent test-mode smoke test",
    {
      skip:
        "Set RUN_STRIPE_SMOKE_TEST=1 to enable.",
    },
    () => {}
  );
} else if (!secretKey) {
  test(
    "Stripe PaymentIntent test-mode smoke test",
    {
      skip:
        "STRIPE_SECRET_KEY is not configured.",
    },
    () => {}
  );
} else {
  test(
    "Stripe PaymentIntent test-mode smoke test",
    async () => {
      assert.match(
        secretKey,
        /^sk_test_/,
        "Smoke test refuses to use a non-test Stripe secret key."
      );

      const result =
        await createPaymentIntent({
          amount: 100,
          currency: "usd",
        });

      assert.match(
        result.paymentId,
        /^pi_/,
      );

      assert.equal(
        typeof result.clientSecret,
        "string"
      );

      assert.ok(
        result.clientSecret.length
        > 0
      );

      assert.equal(
        result.amount,
        100
      );

      assert.equal(
        result.currency,
        "usd"
      );
    }
  );
}