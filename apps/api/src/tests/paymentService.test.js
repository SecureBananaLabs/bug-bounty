import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent rejects non-positive amounts", async () => {
  for (const amount of [0, -1, "-5"]) {
    await assert.rejects(
      () => createPaymentIntent({ amount, currency: "usd" }),
      /amount must be positive/
    );
  }
});

test("createPaymentIntent rejects non-numeric and non-finite amounts", async () => {
  for (const amount of ["abc", Number.NaN, Number.POSITIVE_INFINITY]) {
    await assert.rejects(
      () => createPaymentIntent({ amount, currency: "usd" }),
      /amount must be a finite number/
    );
  }
});

test("createPaymentIntent preserves valid positive amount", async () => {
  const intent = await createPaymentIntent({ amount: "12.50", currency: "usd" });

  assert.equal(intent.amount, 12.5);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
  assert.match(intent.paymentId, /^pay_/);
});
