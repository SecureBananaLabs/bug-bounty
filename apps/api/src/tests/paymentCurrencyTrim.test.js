import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent trims string currency codes", async () => {
  const intent = await createPaymentIntent({
    amount: 100,
    currency: " USD "
  });

  assert.equal(intent.currency, "USD");
});

test("createPaymentIntent keeps default currency when omitted", async () => {
  const intent = await createPaymentIntent({ amount: 100 });

  assert.equal(intent.currency, "usd");
});
