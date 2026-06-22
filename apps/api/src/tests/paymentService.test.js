import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

test("createPaymentIntent normalizes provided currency codes", async () => {
  const paymentIntent = await createPaymentIntent({
    amount: 2500,
    currency: " USD "
  });

  assert.equal(paymentIntent.currency, "usd");
});

test("createPaymentIntent defaults currency to usd", async () => {
  const paymentIntent = await createPaymentIntent({
    amount: 2500
  });

  assert.equal(paymentIntent.currency, "usd");
});

test("createPaymentSchema accepts positive integer amount and optional currency", () => {
  assert.deepEqual(createPaymentSchema.parse({ amount: 2500, currency: "USD" }), {
    amount: 2500,
    currency: "USD"
  });

  assert.deepEqual(createPaymentSchema.parse({ amount: 2500 }), {
    amount: 2500
  });
});

test("createPaymentSchema rejects missing, zero, negative, and decimal amounts", () => {
  assert.throws(() => createPaymentSchema.parse({ currency: "USD" }));
  assert.throws(() => createPaymentSchema.parse({ amount: 0, currency: "USD" }));
  assert.throws(() => createPaymentSchema.parse({ amount: -1, currency: "USD" }));
  assert.throws(() => createPaymentSchema.parse({ amount: 10.5, currency: "USD" }));
});

test("createPaymentSchema rejects invalid currency codes", () => {
  assert.throws(() => createPaymentSchema.parse({ amount: 2500, currency: "" }));
  assert.throws(() => createPaymentSchema.parse({ amount: 2500, currency: "US" }));
  assert.throws(() => createPaymentSchema.parse({ amount: 2500, currency: "USDT" }));
  assert.throws(() => createPaymentSchema.parse({ amount: 2500, currency: "12$" }));
});
