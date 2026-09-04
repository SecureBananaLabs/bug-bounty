import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes provided currency codes", async () => {
  const paymentIntent = await createPaymentIntent({
    amount: 2500,
    currency: "USD"
  });

  assert.equal(paymentIntent.currency, "usd");
});

test("createPaymentIntent defaults currency to usd", async () => {
  const paymentIntent = await createPaymentIntent({
    amount: 2500
  });

  assert.equal(paymentIntent.currency, "usd");
});
