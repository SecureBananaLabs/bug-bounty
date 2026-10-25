import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes provided currency to lowercase", async () => {
  const payment = await createPaymentIntent({ amount: 100, currency: "USD" });

  assert.equal(payment.currency, "usd");
  assert.equal(payment.amount, 100);
});

test("createPaymentIntent defaults missing currency to usd", async () => {
  const payment = await createPaymentIntent({ amount: 100 });

  assert.equal(payment.currency, "usd");
});
