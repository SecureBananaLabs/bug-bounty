import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent trims surrounding whitespace from a currency code", async () => {
  const intent = await createPaymentIntent({ amount: 1000, currency: " USD " });
  assert.equal(intent.currency, "USD");
  assert.equal(intent.amount, 1000);
  assert.equal(intent.provider, "stripe");
});

test("createPaymentIntent trims leading whitespace from a currency code", async () => {
  const intent = await createPaymentIntent({ amount: 500, currency: "  eur" });
  assert.equal(intent.currency, "eur");
});

test("createPaymentIntent trims trailing whitespace from a currency code", async () => {
  const intent = await createPaymentIntent({ amount: 750, currency: "gbp\t" });
  assert.equal(intent.currency, "gbp");
});

test("createPaymentIntent defaults to usd when no currency is provided", async () => {
  const intent = await createPaymentIntent({ amount: 250 });
  assert.equal(intent.currency, "usd");
  assert.equal(intent.amount, 250);
});
