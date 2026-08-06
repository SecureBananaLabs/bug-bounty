import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults currency to USD", async () => {
  const intent = await createPaymentIntent({ amount: 1250 });

  assert.equal(intent.currency, "USD");
  assert.equal(intent.amount, 1250);
  assert.equal(intent.provider, "stripe");
});

test("createPaymentIntent normalizes lowercase currency input", async () => {
  const intent = await createPaymentIntent({ amount: 950, currency: "eur" });

  assert.equal(intent.currency, "EUR");
  assert.equal(intent.amount, 950);
  assert.equal(intent.provider, "stripe");
});
