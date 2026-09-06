import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentSchema } from "../validators/payment.js";

test("createPaymentSchema accepts valid payload", () => {
  const result = createPaymentSchema.safeParse({
    jobId: "job-123",
    amount: 100.50
  });
  assert.equal(result.success, true);
  assert.equal(result.data.currency, "USD");
});

test("createPaymentSchema rejects zero or negative amount", () => {
  const result1 = createPaymentSchema.safeParse({
    jobId: "job-123",
    amount: 0
  });
  assert.equal(result1.success, false);

  const result2 = createPaymentSchema.safeParse({
    jobId: "job-123",
    amount: -50
  });
  assert.equal(result2.success, false);
});
