import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults to uppercase USD", async () => {
  const intent = await createPaymentIntent({ amount: 2500 });

  assert.equal(intent.currency, "USD");
});

test("createPaymentIntent preserves an explicit currency", async () => {
  const intent = await createPaymentIntent({
    amount: 2500,
    currency: "EUR"
  });

  assert.equal(intent.currency, "EUR");
});
