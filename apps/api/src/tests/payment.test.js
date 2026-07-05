import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent generates distinct ids for same-millisecond requests", async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const first = await createPaymentIntent({ amount: 25 });
    const second = await createPaymentIntent({ amount: 25 });

    assert.equal(first.paymentId.startsWith("pay_1700000000000"), true);
    assert.equal(second.paymentId.startsWith("pay_1700000000000"), true);
    assert.notEqual(first.paymentId, second.paymentId);
    assert.equal(first.amount, 25);
    assert.equal(second.amount, 25);
    assert.equal(first.currency, "usd");
    assert.equal(second.currency, "usd");
    assert.equal(first.provider, "stripe");
  } finally {
    Date.now = originalNow;
  }
});
