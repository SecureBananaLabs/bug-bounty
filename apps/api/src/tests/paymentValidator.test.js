import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentSchema } from "../validators/payment.js";

test("createPaymentSchema accepts positive payments", () => {
  const payload = createPaymentSchema.parse({
    amount: 25,
    currency: "EUR",
  });

  assert.deepEqual(payload, {
    amount: 25,
    currency: "eur",
  });
});

test("createPaymentSchema defaults currency to usd", () => {
  const payload = createPaymentSchema.parse({ amount: 25 });

  assert.deepEqual(payload, {
    amount: 25,
    currency: "usd",
  });
});

test("createPaymentSchema rejects non-positive amounts", () => {
  assert.equal(createPaymentSchema.safeParse({ amount: 0 }).success, false);
  assert.equal(createPaymentSchema.safeParse({ amount: -10 }).success, false);
});

test("createPaymentSchema rejects malformed currencies", () => {
  assert.equal(
    createPaymentSchema.safeParse({ amount: 25, currency: "usdollar" }).success,
    false,
  );
  assert.equal(
    createPaymentSchema.safeParse({ amount: 25, currency: "12$" }).success,
    false,
  );
});
