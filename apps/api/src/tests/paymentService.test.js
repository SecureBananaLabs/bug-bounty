import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent includes an initial pending status", async () => {
  const result = await createPaymentIntent({ amount: 2500 });

  assert.equal(result.amount, 2500);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
  assert.equal(result.status, "pending");
  assert.match(result.paymentId, /^pay_/);
});

test("createPaymentIntent preserves an explicit currency with pending status", async () => {
  const result = await createPaymentIntent({ amount: 1000, currency: "eur" });

  assert.equal(result.currency, "eur");
  assert.equal(result.status, "pending");
});
