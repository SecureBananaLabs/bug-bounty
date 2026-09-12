import assert from "node:assert/strict";
import { test } from "node:test";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent preserves the submitted job id", async () => {
  const payment = await createPaymentIntent({
    jobId: "job_123",
    amount: 250,
    currency: "usd",
  });

  assert.equal(payment.jobId, "job_123");
  assert.equal(payment.amount, 250);
  assert.equal(payment.currency, "usd");
  assert.equal(payment.provider, "stripe");
});

test("createPaymentIntent keeps the default currency behavior", async () => {
  const payment = await createPaymentIntent({
    jobId: "job_default_currency",
    amount: 125,
  });

  assert.equal(payment.jobId, "job_default_currency");
  assert.equal(payment.currency, "usd");
});
