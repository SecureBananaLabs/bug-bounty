import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults missing currency to usd", async () => {
  const intent = await createPaymentIntent({ amount: 1000 });

  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent preserves lowercase currency", async () => {
  const intent = await createPaymentIntent({ amount: 1000, currency: "eur" });

  assert.equal(intent.currency, "eur");
});

test("createPaymentIntent normalizes uppercase currency to lowercase", async () => {
  const intent = await createPaymentIntent({ amount: 1000, currency: "USD" });

  assert.equal(intent.currency, "usd");
});
