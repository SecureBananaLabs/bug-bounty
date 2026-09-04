import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes supplied currency to lowercase", async () => {
  const payment = await createPaymentIntent({ amount: 1000, currency: "USD" });

  assert.equal(payment.amount, 1000);
  assert.equal(payment.currency, "usd");
  assert.equal(payment.provider, "stripe");
  assert.match(payment.paymentId, /^pay_\d+$/);
});

test("createPaymentIntent defaults missing currency to usd", async () => {
  const payment = await createPaymentIntent({ amount: 2500 });

  assert.equal(payment.amount, 2500);
  assert.equal(payment.currency, "usd");
});
