import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent preserves the submitted job id", async () => {
  const intent = await createPaymentIntent({
    jobId: "job_123",
    amount: 12500,
    currency: "usd"
  });

  assert.equal(intent.jobId, "job_123");
  assert.equal(intent.amount, 12500);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
  assert.match(intent.paymentId, /^pay_\d+$/);
});
