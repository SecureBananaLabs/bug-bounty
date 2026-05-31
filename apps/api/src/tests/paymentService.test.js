import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults missing currency to USD", async () => {
  const paymentIntent = await createPaymentIntent({ amount: 2500 });

  assert.equal(paymentIntent.amount, 2500);
  assert.equal(paymentIntent.currency, "USD");
  assert.equal(paymentIntent.provider, "stripe");
  assert.match(paymentIntent.paymentId, /^pay_\d+$/);
});

test("createPaymentIntent normalizes lowercase currency codes", async () => {
  const paymentIntent = await createPaymentIntent({
    amount: 1800,
    currency: "eur"
  });

  assert.equal(paymentIntent.amount, 1800);
  assert.equal(paymentIntent.currency, "EUR");
  assert.equal(paymentIntent.provider, "stripe");
});
