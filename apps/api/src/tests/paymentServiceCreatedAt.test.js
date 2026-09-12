import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent includes a server-owned createdAt timestamp", async () => {
  const payment = await createPaymentIntent({
    amount: 2500,
    currency: "usd",
    createdAt: "1999-01-01T00:00:00.000Z"
  });

  assert.match(payment.paymentId, /^pay_/);
  assert.equal(payment.amount, 2500);
  assert.equal(payment.currency, "usd");
  assert.equal(payment.provider, "stripe");
  assert.notEqual(payment.createdAt, "1999-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(payment.createdAt).toISOString());
});
