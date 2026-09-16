import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent exposes initial requires_payment_method status", async () => {
  const intent = await createPaymentIntent({
    amount: 2500,
    currency: "eur"
  });

  assert.equal(intent.amount, 2500);
  assert.equal(intent.currency, "eur");
  assert.equal(intent.provider, "stripe");
  assert.equal(intent.status, "requires_payment_method");
  assert.equal(intent.paymentId.startsWith("pay_"), true);
  assert.equal(intent.paymentId.length > "pay_".length, true);
});

test("createPaymentIntent keeps usd as the default currency", async () => {
  const intent = await createPaymentIntent({
    amount: 1500
  });

  assert.equal(intent.currency, "usd");
  assert.equal(intent.status, "requires_payment_method");
});
