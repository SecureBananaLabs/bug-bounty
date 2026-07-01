import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent preserves submitted jobId and returns correct fields", async () => {
  const payload = {
    jobId: "job_12345",
    amount: 1500,
    currency: "usd"
  };

  const result = await createPaymentIntent(payload);

  assert.ok(result.paymentId.startsWith("pay_"));
  assert.strictEqual(result.jobId, "job_12345");
  assert.strictEqual(result.amount, 1500);
  assert.strictEqual(result.currency, "usd");
  assert.strictEqual(result.provider, "stripe");
});
