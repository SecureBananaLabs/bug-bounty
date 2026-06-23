import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent trims caller-provided currency codes", async () => {
  const payment = await createPaymentIntent({
    amount: 2500,
    currency: " USD "
  });

  assert.equal(payment.amount, 2500);
  assert.equal(payment.currency, "USD");
  assert.equal(payment.provider, "stripe");
});

test("createPaymentIntent defaults missing currency to usd", async () => {
  const payment = await createPaymentIntent({ amount: 1200 });

  assert.equal(payment.currency, "usd");
});
