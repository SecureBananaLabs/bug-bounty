import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults missing currency to USD", async () => {
  const paymentIntent = await createPaymentIntent({ amount: 2500 });

  assert.equal(paymentIntent.amount, 2500);
  assert.equal(paymentIntent.currency, "USD");
  assert.equal(paymentIntent.provider, "stripe");
});

test("createPaymentIntent normalizes lowercase currency code", async () => {
  const paymentIntent = await createPaymentIntent({ amount: 1200, currency: "eur" });

  assert.equal(paymentIntent.currency, "EUR");
  assert.equal(paymentIntent.amount, 1200);
  assert.equal(paymentIntent.provider, "stripe");
});

test("createPaymentIntent rejects invalid currency code", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 1200, currency: "euro" }),
    /currency must be a 3-letter code/
  );
});
