import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent exposes the initial Stripe-like lifecycle status", async () => {
  const intent = await createPaymentIntent({ amount: 1250, currency: "eur" });

  assert.match(intent.paymentId, /^pay_\d+$/);
  assert.equal(intent.amount, 1250);
  assert.equal(intent.currency, "eur");
  assert.equal(intent.provider, "stripe");
  assert.equal(intent.status, "requires_payment_method");
});

test("createPaymentIntent keeps usd as the default currency", async () => {
  const intent = await createPaymentIntent({ amount: 500 });

  assert.equal(intent.currency, "usd");
  assert.equal(intent.status, "requires_payment_method");
});
