import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes explicit currency to lowercase", async () => {
  const payment = await createPaymentIntent({ amount: 5000, currency: "USD" });

  assert.equal(payment.currency, "usd");
});

test("createPaymentIntent defaults missing currency to usd", async () => {
  const payment = await createPaymentIntent({ amount: 5000 });

  assert.equal(payment.currency, "usd");
});
