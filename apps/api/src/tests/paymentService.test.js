import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent preserves the target job id", async () => {
  const payment = await createPaymentIntent({
    amount: 250,
    currency: "USD",
    jobId: "job_123"
  });

  assert.equal(payment.jobId, "job_123");
});
