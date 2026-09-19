import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults missing currency to USD", async () => {
  const intent = await createPaymentIntent({ amount: 1250 });

  assert.equal(intent.amount, 1250);
  assert.equal(intent.currency, "USD");
  assert.equal(intent.provider, "stripe");
  assert.match(intent.paymentId, /^pay_\d+$/);
});

test("createPaymentIntent normalizes lowercase currency codes", async () => {
  const intent = await createPaymentIntent({ amount: 4500, currency: "eur" });

  assert.equal(intent.amount, 4500);
  assert.equal(intent.currency, "EUR");
  assert.equal(intent.provider, "stripe");
  assert.match(intent.paymentId, /^pay_\d+$/);
});
