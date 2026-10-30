import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent rejects zero amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    { message: "Amount must be a positive number" }
  );
});

test("createPaymentIntent rejects negative amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: -10 }),
    { message: "Amount must be a positive number" }
  );
});

test("createPaymentIntent rejects NaN amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: NaN }),
    { message: "Amount must be a positive number" }
  );
});

test("createPaymentIntent rejects Infinity amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: Infinity }),
    { message: "Amount must be a positive number" }
  );
});

test("createPaymentIntent rejects string amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: "fifty" }),
    { message: "Amount must be a positive number" }
  );
});

test("createPaymentIntent rejects undefined amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({}),
    { message: "Amount must be a positive number" }
  );
});

test("createPaymentIntent accepts valid positive amount", async () => {
  const result = await createPaymentIntent({ amount: 29.99 });
  assert.equal(result.amount, 29.99);
  assert.ok(result.paymentId.startsWith("pay_"));
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});

test("createPaymentIntent accepts custom currency with valid amount", async () => {
  const result = await createPaymentIntent({ amount: 100, currency: "eur" });
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "eur");
});

test("rejected amounts throw with status 400", async () => {
  try {
    await createPaymentIntent({ amount: -5 });
    assert.fail("Should have thrown");
  } catch (err) {
    assert.equal(err.status, 400);
  }
});
