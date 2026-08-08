import test from "node:test";
import assert from "node:assert/strict";
import { _private } from "../services/paymentService.js";

test("validatePaymentPayload accepts positive integer amount and normalizes currency", () => {
  assert.deepEqual(
    _private.validatePaymentPayload({
      amount: 1250,
      currency: "INR",
      metadata: { orderId: "order_123" }
    }),
    {
      amount: 1250,
      currency: "inr",
      metadata: { orderId: "order_123" }
    }
  );
});

test("validatePaymentPayload rejects missing or invalid amount", () => {
  assert.throws(
    () => _private.validatePaymentPayload({ currency: "usd" }),
    /amount must be a positive integer/
  );
  assert.throws(
    () => _private.validatePaymentPayload({ amount: 10.5, currency: "usd" }),
    /amount must be a positive integer/
  );
  assert.throws(
    () => _private.validatePaymentPayload({ amount: -1, currency: "usd" }),
    /amount must be a positive integer/
  );
});

test("validatePaymentPayload rejects invalid currency and metadata", () => {
  assert.throws(
    () => _private.validatePaymentPayload({ amount: 100, currency: "us" }),
    /currency must be a valid three-letter ISO currency code/
  );
  assert.throws(
    () => _private.validatePaymentPayload({ amount: 100, metadata: [] }),
    /metadata must be an object/
  );
});
