import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentSchema } from "../validators/payment.js";

test("createPaymentSchema rejects missing amount", () => {
  const result = createPaymentSchema.safeParse({ currency: "usd" });
  assert.equal(result.success, false);
  assert.equal(result.error.errors[0].message, "Required");
});

test("createPaymentSchema rejects zero amount", () => {
  const result = createPaymentSchema.safeParse({ amount: 0 });
  assert.equal(result.success, false);
  assert.ok(result.error.errors[0].message.includes("positive integer"));
});

test("createPaymentSchema rejects negative amount", () => {
  const result = createPaymentSchema.safeParse({ amount: -100 });
  assert.equal(result.success, false);
});

test("createPaymentSchema rejects non-integer amount", () => {
  const result = createPaymentSchema.safeParse({ amount: 1.5 });
  assert.equal(result.success, false);
});

test("createPaymentSchema defaults currency to usd", () => {
  const result = createPaymentSchema.safeParse({ amount: 2000 });
  assert.equal(result.success, true);
  assert.equal(result.data.currency, "usd");
  assert.equal(result.data.amount, 2000);
});

test("createPaymentSchema accepts valid payload with custom currency", () => {
  const result = createPaymentSchema.safeParse({ amount: 1500, currency: "eur" });
  assert.equal(result.success, true);
  assert.equal(result.data.amount, 1500);
  assert.equal(result.data.currency, "eur");
});

test("createPaymentSchema rejects amount with non-3-letter currency", () => {
  const result = createPaymentSchema.safeParse({ amount: 100, currency: "usdollars" });
  assert.equal(result.success, false);
});

test("createPaymentSchema rejects non-number amount", () => {
  const result = createPaymentSchema.safeParse({ amount: "not-a-number" });
  assert.equal(result.success, false);
});
