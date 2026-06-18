import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent exposes an initial payment lifecycle status", async () => {
  const intent = await createPaymentIntent({ amount: 1200, currency: "usd" });

  assert.equal(intent.amount, 1200);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
  assert.equal(intent.status, "requires_payment_method");
  assert.match(intent.paymentId, /^pay_\d+$/);
});
