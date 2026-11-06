import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("payment intent includes server-owned createdAt timestamp", async () => {
  const originalDateNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const result = await createPaymentIntent({ amount: 250, currency: "usd" });

    assert.match(result.createdAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(result.provider, "stripe");
    assert.equal(result.currency, "usd");
    assert.equal(result.amount, 250);
  } finally {
    Date.now = originalDateNow;
  }
});
