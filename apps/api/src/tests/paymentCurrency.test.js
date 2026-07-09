import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("Payment currency normalization", async (t) => {
  await t.test("trims and normalizes mixed-case currency", async () => {
    const intent = await createPaymentIntent({
      amount: 100,
      currency: " USD "
    });
    assert.equal(intent.currency, "usd");
  });

  await t.test("normalizes uppercase currency without whitespace", async () => {
    const intent = await createPaymentIntent({
      amount: 200,
      currency: "EUR"
    });
    assert.equal(intent.currency, "eur");
  });

  await t.test("uses default fallback when currency is missing", async () => {
    const intent = await createPaymentIntent({
      amount: 50
    });
    assert.equal(intent.currency, "usd");
  });
});
