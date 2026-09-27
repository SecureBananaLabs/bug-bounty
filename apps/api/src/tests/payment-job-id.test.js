import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("payment intents preserve submitted job ids", async () => {
  const payment = await createPaymentIntent({
    jobId: "job_123",
    amount: 120,
    currency: "usd"
  });

  assert.match(payment.paymentId, /^pay_/);
  assert.equal(payment.jobId, "job_123");
  assert.equal(payment.amount, 120);
  assert.equal(payment.currency, "usd");
  assert.equal(payment.provider, "stripe");
});
