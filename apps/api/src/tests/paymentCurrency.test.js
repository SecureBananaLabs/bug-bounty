import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

describe("Payment Currency Lowercase Normalization (createPaymentIntent)", () => {
  it("normalizes uppercase and mixed-case currency codes to lowercase", async () => {
    const usdIntent = await createPaymentIntent({ amount: 100, currency: "USD" });
    assert.equal(usdIntent.currency, "usd");

    const eurIntent = await createPaymentIntent({ amount: 250, currency: "EuR" });
    assert.equal(eurIntent.currency, "eur");

    const gbpIntent = await createPaymentIntent({ amount: 500, currency: "  GBP  " });
    assert.equal(gbpIntent.currency, "gbp");
  });

  it("defaults to 'usd' when currency is omitted, null, or blank", async () => {
    const defaultIntent = await createPaymentIntent({ amount: 150 });
    assert.equal(defaultIntent.currency, "usd");

    const blankIntent = await createPaymentIntent({ amount: 150, currency: "   " });
    assert.equal(blankIntent.currency, "usd");
  });
});
