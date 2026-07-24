import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent trims provided currency codes", async () => {
  const intent = await createPaymentIntent({
    amount: 2500,
    currency: " usd "
  });

  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent defaults missing currency to usd", async () => {
  const intent = await createPaymentIntent({ amount: 2500 });

  assert.equal(intent.currency, "usd");
});
