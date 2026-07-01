import test from "node:test";
import assert from "node:assert/strict";
import { createPayment } from "../controllers/paymentController.js";
import { createPaymentSchema } from "../validators/payment.js";

function createResponse() {
  return {
    statusCode: 0,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test("createPaymentSchema rejects non-positive amounts and malformed currencies", () => {
  assert.equal(createPaymentSchema.safeParse({ amount: 0, currency: "usd" }).success, false);
  assert.equal(createPaymentSchema.safeParse({ amount: -1, currency: "usd" }).success, false);
  assert.equal(createPaymentSchema.safeParse({ amount: 10, currency: "" }).success, false);
  assert.equal(createPaymentSchema.safeParse({ amount: 10, currency: "usdt" }).success, false);
});

test("createPaymentSchema defaults currency to usd and normalizes case", () => {
  const defaulted = createPaymentSchema.safeParse({ amount: 10 });
  const normalized = createPaymentSchema.safeParse({ amount: 10, currency: "EUR" });

  assert.equal(defaulted.success, true);
  assert.equal(defaulted.data.currency, "usd");
  assert.equal(normalized.success, true);
  assert.equal(normalized.data.currency, "eur");
});

test("createPayment returns 400 before creating invalid payment intents", async () => {
  const response = createResponse();

  await createPayment({ body: { amount: -25, currency: "usd" } }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: "Invalid payment payload"
  });
});

test("createPayment creates intents from validated payloads", async () => {
  const response = createResponse();

  await createPayment({ body: { amount: 125, currency: "EUR" } }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.match(response.body.data.paymentId, /^pay_/);
  assert.equal(response.body.data.amount, 125);
  assert.equal(response.body.data.currency, "eur");
  assert.equal(response.body.data.provider, "stripe");
});
