import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent currency normalization", async () => {
  const p1 = await createPaymentIntent({ amount: 100, currency: "USD" });
  assert.equal(p1.currency, "usd");

  const p2 = await createPaymentIntent({ amount: 200, currency: " eur " });
  assert.equal(p2.currency, "eur");

  const p3 = await createPaymentIntent({ amount: 300, currency: undefined });
  assert.equal(p3.currency, "usd");
});
