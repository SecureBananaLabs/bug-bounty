import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent rejects non-positive payment amounts", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0, currency: "usd" }),
    {
      message: "Payment amount must be a positive number",
      statusCode: 400
    }
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: -10, currency: "usd" }),
    {
      message: "Payment amount must be a positive number",
      statusCode: 400
    }
  );
});

test("createPaymentIntent accepts positive payment amounts", async () => {
  const intent = await createPaymentIntent({ amount: 100, currency: "usd" });

  assert.match(intent.paymentId, /^pay_/);
  assert.equal(intent.amount, 100);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
});
