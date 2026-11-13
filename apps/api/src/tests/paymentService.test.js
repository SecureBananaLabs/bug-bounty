import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes submitted currency values", async () => {
  const intent = await createPaymentIntent({
    amount: 125,
    currency: " USD "
  });

  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent defaults blank currency values to usd", async () => {
  const intent = await createPaymentIntent({
    amount: 125,
    currency: "   "
  });

  assert.equal(intent.currency, "usd");
});
