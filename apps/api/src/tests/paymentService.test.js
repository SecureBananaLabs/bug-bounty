import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("payment intents remain unique within the same millisecond", async () => {
  const originalNow = Date.now;
  Date.now = () => 1_725_000_000_000;

  try {
    const first = await createPaymentIntent({ amount: 1250, currency: "gbp" });
    const second = await createPaymentIntent({ amount: 1250, currency: "gbp" });

    assert.match(first.paymentId, /^pay_1725000000000_[0-9a-f-]{36}$/);
    assert.match(second.paymentId, /^pay_1725000000000_[0-9a-f-]{36}$/);
    assert.notEqual(first.paymentId, second.paymentId);
    assert.deepEqual(
      { amount: first.amount, currency: first.currency, provider: first.provider },
      { amount: 1250, currency: "gbp", provider: "stripe" }
    );
  } finally {
    Date.now = originalNow;
  }
});

test("payment intent preserves the default currency", async () => {
  const payment = await createPaymentIntent({ amount: 500 });

  assert.equal(payment.amount, 500);
  assert.equal(payment.currency, "usd");
  assert.equal(payment.provider, "stripe");
  assert.match(payment.paymentId, /^pay_\d+_[0-9a-f-]{36}$/);
});
