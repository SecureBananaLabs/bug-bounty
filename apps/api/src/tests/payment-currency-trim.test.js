import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent trims provided currency codes", async () => {
  const payment = await createPaymentIntent({
    amount: 100,
    currency: " usd ",
  });

  assert.equal(payment.currency, "usd");
});

test("createPaymentIntent keeps missing currency default", async () => {
  const payment = await createPaymentIntent({ amount: 100 });

  assert.equal(payment.currency, "usd");
});
