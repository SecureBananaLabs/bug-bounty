process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_123";

import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const runIntegration = process.env.STRIPE_INTEGRATION_TESTS === "true";

runIntegration &&
  test(
    "createPaymentIntent creates real test-mode PaymentIntent against Stripe API",
    async () => {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error(
          "STRIPE_SECRET_KEY is required for Stripe integration tests"
        );
      }

      const result = await createPaymentIntent({
        amount: 100,
        currency: "usd"
      });

      assert.ok(result.paymentId.startsWith("pi_"));
      assert.ok(result.clientSecret.startsWith(result.paymentId));
    }
  );
