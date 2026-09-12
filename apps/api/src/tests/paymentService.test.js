import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent returns an explicit initial lifecycle status", async () => {
  const intent = await createPaymentIntent({
    amount: 125,
    currency: "USD"
  });

  assert.equal(intent.status, "pending");
  assert.equal(intent.provider, "stripe");
  assert.equal(intent.amount, 125);
  assert.equal(intent.currency, "USD");
});
