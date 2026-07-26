import test from "node:test";
import assert from "node:assert/strict";

// Each test file gets a fresh module graph under node --test.
const { createPaymentIntent } = await import("../services/paymentService.js");

test("createPaymentIntent assigns a unique paymentId on every call", async () => {
  const a = await createPaymentIntent({ amount: 1000 });
  const b = await createPaymentIntent({ amount: 2000 });
  assert.notEqual(a.paymentId, b.paymentId, "consecutive intents must not share an id");
  assert.match(a.paymentId, /^pay_[0-9a-f-]{36}$/);
  assert.match(b.paymentId, /^pay_[0-9a-f-]{36}$/);
});

test("createPaymentIntent preserves the pay_ prefix", async () => {
  const p = await createPaymentIntent({ amount: 100 });
  assert.ok(p.paymentId.startsWith("pay_"));
});

test("createPaymentIntent returns amount, currency (default usd), and provider stripe", async () => {
  const p = await createPaymentIntent({ amount: 4999 });
  assert.equal(p.amount, 4999);
  assert.equal(p.currency, "usd");
  assert.equal(p.provider, "stripe");
});

test("createPaymentIntent preserves an explicit currency value", async () => {
  const p = await createPaymentIntent({ amount: 4999, currency: "EUR" });
  assert.equal(p.currency, "EUR");
});

test("createPaymentIntent stays unique even when Date.now() is frozen at one millisecond", async () => {
  const realNow = Date.now;
  let frozen = 1_700_000_000_000;
  Date.now = () => frozen;

  try {
    const a = await createPaymentIntent({ amount: 1 });
    const b = await createPaymentIntent({ amount: 2 });
    const c = await createPaymentIntent({ amount: 3 });
    assert.notEqual(a.paymentId, b.paymentId);
    assert.notEqual(b.paymentId, c.paymentId);
    assert.notEqual(a.paymentId, c.paymentId);
  } finally {
    Date.now = realNow;
  }
});
