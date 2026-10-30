import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent generates distinct pay_ IDs even when Date.now() is frozen", async () => {
  const realDateNow = Date.now;
  Date.now = () => 1700000000000;
  try {
    const first = await createPaymentIntent({ amount: 150, currency: "usd" });
    const second = await createPaymentIntent({ amount: 150, currency: "usd" });

    assert.match(first.paymentId, /^pay_[0-9a-f-]{36}$/i);
    assert.match(second.paymentId, /^pay_[0-9a-f-]{36}$/i);
    assert.notEqual(first.paymentId, second.paymentId);
    assert.equal(first.amount, 150);
    assert.equal(first.currency, "usd");
    assert.equal(first.provider, "stripe");
  } finally {
    Date.now = realDateNow;
  }
});

test("createPaymentIntent prevents caller-supplied paymentId from overriding server-generated ID", async () => {
  const intent = await createPaymentIntent({
    paymentId: "pay_forged_123",
    amount: 250
  });
  assert.notEqual(intent.paymentId, "pay_forged_123");
  assert.match(intent.paymentId, /^pay_[0-9a-f-]{36}$/i);
  assert.equal(intent.amount, 250);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
});

test("createPaymentIntent handles null, undefined, and array payloads safely", async () => {
  const fromNull = await createPaymentIntent(null);
  const fromUndefined = await createPaymentIntent(undefined);
  const fromArray = await createPaymentIntent(["bad"]);

  assert.match(fromNull.paymentId, /^pay_[0-9a-f-]{36}$/i);
  assert.match(fromUndefined.paymentId, /^pay_[0-9a-f-]{36}$/i);
  assert.match(fromArray.paymentId, /^pay_[0-9a-f-]{36}$/i);
  assert.equal(fromNull.currency, "usd");
  assert.equal(fromUndefined.currency, "usd");
  assert.equal(fromArray.currency, "usd");
});
