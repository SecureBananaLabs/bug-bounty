import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentConfigurationError } from "../services/paymentService.js";

test("createPaymentIntent rejects missing Stripe config in production", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 2500, currency: "usd" }, { nodeEnv: "production", stripeSecretKey: "" }),
    PaymentConfigurationError
  );
});

test("createPaymentIntent keeps development stub behavior", async () => {
  const paymentIntent = await createPaymentIntent(
    { amount: 2500, currency: "usd" },
    { nodeEnv: "development", stripeSecretKey: "" }
  );

  assert.match(paymentIntent.paymentId, /^pay_\d+$/);
  assert.equal(paymentIntent.amount, 2500);
  assert.equal(paymentIntent.currency, "usd");
  assert.equal(paymentIntent.provider, "stripe");
});

test("createPaymentIntent accepts configured production Stripe secret", async () => {
  const paymentIntent = await createPaymentIntent(
    { amount: 2500 },
    { nodeEnv: "production", stripeSecretKey: "sk_live_configured" }
  );

  assert.match(paymentIntent.paymentId, /^pay_\d+$/);
  assert.equal(paymentIntent.currency, "usd");
});
