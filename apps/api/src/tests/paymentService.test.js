import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent preserves the submitted job id", async () => {
  const intent = await createPaymentIntent({
    jobId: "job_123",
    amount: 2500,
    currency: "usd"
  });

  assert.equal(intent.jobId, "job_123");
  assert.equal(intent.amount, 2500);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
});
