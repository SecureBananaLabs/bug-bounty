import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent trims currency codes", async () => {
  const result = await createPaymentIntent({
    amount: 1500,
    currency: " USD "
  });

  assert.equal(result.currency, "USD");
});

test("createPaymentIntent defaults missing currency to usd", async () => {
  const result = await createPaymentIntent({
    amount: 1500
  });

  assert.equal(result.currency, "usd");
});
