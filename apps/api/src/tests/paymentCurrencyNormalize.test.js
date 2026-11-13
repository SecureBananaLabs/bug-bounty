import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes string currency codes to lowercase", async () => {
  const intent = await createPaymentIntent({
    amount: 100,
    currency: "USD"
  });

  assert.equal(intent.currency, "usd");
});

test("createPaymentIntent normalizes mixed-case currency codes", async () => {
  const intent = await createPaymentIntent({
    amount: 100,
    currency: "EuR"
  });

  assert.equal(intent.currency, "eur");
});

test("createPaymentIntent keeps default currency when omitted", async () => {
  const intent = await createPaymentIntent({ amount: 100 });

  assert.equal(intent.currency, "usd");
});
