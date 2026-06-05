import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent accepts positive amount and normalizes currency", async () => {
  const intent = await createPaymentIntent({ amount: 1500, currency: "USD" });

  assert.match(intent.paymentId, /^pay_\d+$/);
  assert.equal(intent.amount, 1500);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
});

test("createPaymentIntent defaults currency to usd", async () => {
  const intent = await createPaymentIntent({ amount: 25 });

  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent rejects invalid payment payloads", async () => {
  assert.rejects(() => createPaymentIntent({ amount: 0 }), /finite positive number/);
  assert.rejects(() => createPaymentIntent({ amount: -1 }), /finite positive number/);
  assert.rejects(() => createPaymentIntent({ amount: Number.NaN }), /finite positive number/);
  assert.rejects(() => createPaymentIntent({ amount: 10, currency: "" }), /three-letter code/);
  assert.rejects(() => createPaymentIntent({ amount: 10, currency: "usdc" }), /three-letter code/);
});
