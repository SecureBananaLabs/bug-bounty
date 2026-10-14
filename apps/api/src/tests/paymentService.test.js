import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes currency values", async () => {
  const result = await createPaymentIntent({
    amount: 250,
    currency: " USD "
  });

  assert.equal(result.amount, 250);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
