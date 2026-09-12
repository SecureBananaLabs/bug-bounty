import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentValidationError } from "../services/paymentService.js";

test("createPaymentIntent defaults missing currency to usd", async () => {
  const intent = await createPaymentIntent({ amount: 25 });

  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent normalizes supported currency codes", async () => {
  const intent = await createPaymentIntent({ amount: 25, currency: "EUR" });

  assert.equal(intent.currency, "eur");
});

test("createPaymentIntent rejects unsupported currency codes", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 25, currency: "DOGE" }),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "Unsupported payment currency: DOGE",
  );
});
