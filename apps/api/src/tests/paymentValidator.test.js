import test from "node:test";
import assert from "node:assert/strict";
import { paymentIntentSchema } from "../validators/payment.js";
import { createPaymentIntent } from "../services/paymentService.js";

test("payment intent schema rejects missing and non-positive amounts", () => {
  assert.equal(paymentIntentSchema.safeParse({ currency: "usd" }).success, false);
  assert.equal(paymentIntentSchema.safeParse({ amount: 0, currency: "usd" }).success, false);
  assert.equal(paymentIntentSchema.safeParse({ amount: -1, currency: "usd" }).success, false);
  assert.equal(paymentIntentSchema.safeParse({ amount: "100", currency: "usd" }).success, false);
});

test("payment intent schema defaults currency and rejects unsupported values", () => {
  assert.deepEqual(paymentIntentSchema.parse({ amount: 25 }), {
    amount: 25,
    currency: "usd"
  });
  assert.equal(paymentIntentSchema.safeParse({ amount: 25, currency: "doge" }).success, false);
});

test("payment intent service returns validated payload values", async () => {
  const payment = await createPaymentIntent(paymentIntentSchema.parse({
    amount: 25,
    currency: "eur"
  }));

  assert.match(payment.paymentId, /^pay_\d+$/);
  assert.equal(payment.amount, 25);
  assert.equal(payment.currency, "eur");
  assert.equal(payment.provider, "stripe");
});
