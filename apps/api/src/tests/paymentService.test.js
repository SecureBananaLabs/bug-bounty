import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes currency to lowercase", async () => {
  const intent = await createPaymentIntent({ amount: 1500, currency: "GBP" });

  assert.equal(intent.amount, 1500);
  assert.equal(intent.currency, "gbp");
  assert.equal(intent.provider, "stripe");
});

test("createPaymentIntent defaults missing currency to usd", async () => {
  const intent = await createPaymentIntent({ amount: 2500 });

  assert.equal(intent.currency, "usd");
});
