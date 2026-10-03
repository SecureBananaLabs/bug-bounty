import test from "node:test";
import assert from "node:assert/strict";

// Set a fake key so Stripe constructor doesn't complain
process.env.STRIPE_SECRET_KEY = "sk_test_mock_key_for_testing";

// Validation-only tests — these throw before hitting Stripe API
test("createPaymentIntent > throws when amount is missing", async () => {
  const { createPaymentIntent } = await import("../services/paymentService.js");
  await assert.rejects(
    () => createPaymentIntent({}),
    { message: /amount is required/ }
  );
});

test("createPaymentIntent > throws when amount is not a positive integer", async () => {
  const { createPaymentIntent } = await import("../services/paymentService.js");
  await assert.rejects(
    () => createPaymentIntent({ amount: -100 }),
    { message: /amount is required/ }
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }),
    { message: /amount is required/ }
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: "100" }),
    { message: /amount is required/ }
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    { message: /amount is required/ }
  );
});

// Smoke/integration test (guarded by env flag)
test("createPaymentIntent > smoke test with Stripe test mode", { skip: !process.env.RUN_STRIPE_SMOKE }, async () => {
  const { createPaymentIntent } = await import("../services/paymentService.js");
  const result = await createPaymentIntent({ amount: 1000, currency: "usd" });
  assert.ok(result.clientSecret, "clientSecret should be returned");
  assert.ok(result.paymentId, "paymentId should be returned");
  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /_secret_/);
});
