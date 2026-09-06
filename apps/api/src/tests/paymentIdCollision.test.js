import assert from "node:assert/strict";
import test from "node:test";

import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent generates distinct ids even within the same millisecond", async () => {
  const originalNow = Date.now;
  Date.now = () => 1787930000000;

  try {
    const first = await createPaymentIntent({ amount: 1000, currency: "usd" });
    const second = await createPaymentIntent({ amount: 1000, currency: "usd" });

    assert.match(first.paymentId, /^pay_[0-9a-f-]{36}$/);
    assert.match(second.paymentId, /^pay_[0-9a-f-]{36}$/);
    assert.notEqual(first.paymentId, second.paymentId);
    assert.equal(first.amount, 1000);
    assert.equal(first.currency, "usd");
    assert.equal(first.provider, "stripe");
  } finally {
    Date.now = originalNow;
  }
});
