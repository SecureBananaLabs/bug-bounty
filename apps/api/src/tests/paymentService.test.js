import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults currency to usd", async () => {
  const payment = await createPaymentIntent({ amount: 100 });
  assert.equal(payment.currency, "usd");
});

test("createPaymentIntent lowercases uppercase currency codes", async () => {
  const payment = await createPaymentIntent({ amount: 100, currency: "USD" });
  assert.equal(payment.currency, "usd");
});

test("createPaymentIntent trims whitespace around currency codes", async () => {
  const payment = await createPaymentIntent({ amount: 100, currency: "  Eur  " });
  assert.equal(payment.currency, "eur");
});
