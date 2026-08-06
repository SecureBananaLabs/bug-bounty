import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent generates unique ids for same-millisecond requests", async () => {
  const originalNow = Date.now;
  Date.now = () => 1720000000000;

  try {
    const first = await createPaymentIntent({ amount: 1000 });
    const second = await createPaymentIntent({ amount: 2500 });

    assert.match(first.paymentId, /^pay_/);
    assert.match(second.paymentId, /^pay_/);
    assert.notEqual(first.paymentId, second.paymentId);
  } finally {
    Date.now = originalNow;
  }
});
