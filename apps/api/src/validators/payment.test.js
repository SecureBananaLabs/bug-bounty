import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCreatePayment } from "./payment.js";

describe("Payment Validation & Positive Amounts (#743)", () => {
  it("rejects non-positive payment amounts (<= 0)", () => {
    const resZero = validateCreatePayment({ amount: 0 });
    assert.equal(resZero.ok, false);
    assert.equal(resZero.error, "Payment amount must be a positive number greater than zero");

    const resNeg = validateCreatePayment({ amount: -50 });
    assert.equal(resNeg.ok, false);
    assert.equal(resNeg.error, "Payment amount must be a positive number greater than zero");
  });

  it("rejects unsupported currencies", () => {
    const res = validateCreatePayment({ amount: 100, currency: "fake_token" });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Unsupported currency. Allowed: USD, EUR, GBP, CAD, AUD");
  });

  it("rejects short or oversized transactionId (< 8 or > 64 chars)", () => {
    const res1 = validateCreatePayment({ amount: 100, transactionId: "tx_12" });
    assert.equal(res1.ok, false);
    assert.equal(res1.error, "transactionId must be at least 8 characters");

    const res2 = validateCreatePayment({ amount: 100, transactionId: "x".repeat(65) });
    assert.equal(res2.ok, false);
    assert.equal(res2.error, "transactionId cannot exceed 64 characters");
  });

  it("accepts valid payment with positive amount and default USD currency", () => {
    const res = validateCreatePayment({ amount: 250, transactionId: "tx_sec_99182a3c" });
    assert.equal(res.ok, true);
    assert.equal(res.data.amount, 250);
    assert.equal(res.data.currency, "usd");
    assert.equal(res.data.transactionId, "tx_sec_99182a3c");
  });
});

