import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes currency to lowercase", async () => {
  const payment = await createPaymentIntent({ amount: 100, currency: "USD" });

  assert.equal(payment.amount, 100);
  assert.equal(payment.currency, "usd");
  assert.equal(payment.provider, "stripe");
});

test("createPaymentIntent keeps default currency lowercase", async () => {
  const payment = await createPaymentIntent({ amount: 100 });

  assert.equal(payment.currency, "usd");
});
