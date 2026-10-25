import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent returns initial requires_payment_method status", async () => {
  const intent = await createPaymentIntent({ amount: 1000 });

  assert.equal(intent.status, "requires_payment_method");
  assert.ok(intent.paymentId.startsWith("pay_"));
  assert.equal(intent.amount, 1000);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
});

test("createPaymentIntent respects provided currency", async () => {
  const intent = await createPaymentIntent({ amount: 500, currency: "eur" });

  assert.equal(intent.currency, "eur");
  assert.equal(intent.status, "requires_payment_method");
});
