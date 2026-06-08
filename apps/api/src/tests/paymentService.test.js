import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent exposes initial requires_payment_method status", async () => {
  const intent = await createPaymentIntent({
    amount: 2500,
    currency: "usd"
  });

  assert.equal(intent.amount, 2500);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
  assert.equal(intent.status, "requires_payment_method");
  assert.match(intent.paymentId, /^pay_\d+$/);
});

test("createPaymentIntent keeps usd as the default currency", async () => {
  const intent = await createPaymentIntent({
    amount: 1500
  });

  assert.equal(intent.currency, "usd");
  assert.equal(intent.status, "requires_payment_method");
});
