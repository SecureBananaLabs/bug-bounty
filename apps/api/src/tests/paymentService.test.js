import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent normalizes currency to lowercase", async () => {
  const usdPayment = await createPaymentIntent({ amount: 25, currency: "USD" });
  const gbpPayment = await createPaymentIntent({ amount: 30, currency: "GBP" });
  const defaultPayment = await createPaymentIntent({ amount: 35 });

  assert.equal(usdPayment.currency, "usd");
  assert.equal(gbpPayment.currency, "gbp");
  assert.equal(defaultPayment.currency, "usd");
});
