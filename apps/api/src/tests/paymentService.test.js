import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("normalizes uppercase currency to lowercase", async () => {
  const intent = await createPaymentIntent({ amount: 125, currency: "USD" });
  assert.equal(intent.currency, "usd");
});

test("trims whitespace around currency", async () => {
  const intent = await createPaymentIntent({ amount: 125, currency: " USD " });
  assert.equal(intent.currency, "usd");
});

test("defaults to usd when currency is only whitespace", async () => {
  const intent = await createPaymentIntent({ amount: 125, currency: "   " });
  assert.equal(intent.currency, "usd");
});

test("defaults to usd when currency is missing", async () => {
  const intent = await createPaymentIntent({ amount: 125 });
  assert.equal(intent.currency, "usd");
});

test("preserves a valid lowercase currency", async () => {
  const intent = await createPaymentIntent({ amount: 125, currency: "eur" });
  assert.equal(intent.currency, "eur");
});
