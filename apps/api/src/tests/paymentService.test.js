import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults currency to usd", async () => {
  const intent = await createPaymentIntent({ amount: 2500 });

  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent normalizes currency to lowercase", async () => {
  const intent = await createPaymentIntent({ amount: 2500, currency: "USD" });

  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent trims whitespace before normalizing currency", async () => {
  const intent = await createPaymentIntent({ amount: 2500, currency: "  GbP  " });

  assert.equal(intent.currency, "gbp");
});
