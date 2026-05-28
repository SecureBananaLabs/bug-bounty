import test from "node:test";
import assert from "node:assert/strict";
import { createPayment } from "../controllers/paymentController.js";

function mockRes() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test("createPayment rejects non-positive amounts", async () => {
  const res = mockRes();

  await createPayment({ body: { amount: -1, currency: "usd" } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "Amount must be a positive number"
  });
});

test("createPayment accepts positive numeric amounts", async () => {
  const res = mockRes();

  await createPayment({ body: { amount: 120, currency: "usd" } }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.amount, 120);
  assert.equal(res.body.data.currency, "usd");
  assert.equal(res.body.data.provider, "stripe");
  assert.equal(res.body.data.paymentId.startsWith("pay_"), true);
});
