import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults to uppercase USD", async () => {
  const intent = await createPaymentIntent({ amount: 2500 });

  assert.equal(intent.currency, "USD");
});

test("createPaymentIntent normalizes lowercase currency codes", async () => {
  const intent = await createPaymentIntent({ amount: 2500, currency: "eur" });

  assert.equal(intent.currency, "EUR");
});
