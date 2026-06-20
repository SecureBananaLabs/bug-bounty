import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent lowercases uppercase currency codes", async () => {
  const intent = await createPaymentIntent({ amount: 1000, currency: "USD" });
  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent lowercases mixed-case currency codes", async () => {
  const intent = await createPaymentIntent({ amount: 1000, currency: "Gbp" });
  assert.equal(intent.currency, "gbp");
});

test("createPaymentIntent defaults to usd when currency is missing", async () => {
  const intent = await createPaymentIntent({ amount: 1000 });
  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent keeps already-lowercase currency codes unchanged", async () => {
  const intent = await createPaymentIntent({ amount: 1000, currency: "eur" });
  assert.equal(intent.currency, "eur");
});
