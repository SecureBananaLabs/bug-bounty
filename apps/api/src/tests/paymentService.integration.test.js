import { test } from "node:test";
import assert from "node:assert";
import { createPaymentIntent } from "../services/paymentService.js";

// Integration test - only run if STRIPE_SECRET_KEY is set and ENABLE_STRIPE_INTEGRATION_TESTS is true
const isIntegrationTestEnabled =
  process.env.STRIPE_SECRET_KEY &&
  process.env.ENABLE_STRIPE_INTEGRATION_TESTS === "true";

if (isIntegrationTestEnabled) {
  test("[Integration] createPaymentIntent - creates real PaymentIntent with Stripe API", async () => {
    const payload = {
      amount: 1000,
      currency: "usd",
      metadata: {
        test: "integration_test",
        timestamp: new Date().toISOString()
      }
    };

    const result = await createPaymentIntent(payload);

    // Assert structure
    assert(result.clientSecret, "clientSecret must be present");
    assert(result.paymentId, "paymentId must be present");
    assert(result.paymentId.startsWith("pi_"), "paymentId should start with pi_");
    assert(
      result.clientSecret.includes("_secret_"),
      "clientSecret should contain _secret_"
    );
    assert.strictEqual(result.amount, 1000);
    assert.strictEqual(result.currency, "usd");

    console.log("✓ Integration test passed: PaymentIntent created successfully");
  });
} else {
  console.log(
    "ℹ Stripe integration tests skipped. Set STRIPE_SECRET_KEY and ENABLE_STRIPE_INTEGRATION_TESTS=true to enable."
  );
}
