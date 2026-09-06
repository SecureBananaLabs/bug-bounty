import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent returns an initial requires_payment_method status", async () => {
  const paymentIntent = await createPaymentIntent({
    amount: 2500,
    currency: "eur"
  });

  assert.equal(paymentIntent.amount, 2500);
  assert.equal(paymentIntent.currency, "eur");
  assert.equal(paymentIntent.provider, "stripe");
  assert.equal(paymentIntent.status, "requires_payment_method");
  assert.match(paymentIntent.paymentId, /^pay_/);
});
