import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentValidationError } from "../services/paymentService.js";

test("createPaymentIntent accepts positive numeric amounts", async () => {
  const intent = await createPaymentIntent({ amount: "25", currency: "usd" });

  assert.equal(intent.amount, 25);
});

test("createPaymentIntent rejects zero amounts", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0, currency: "usd" }),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "Payment amount must be a positive number",
  );
});

test("createPaymentIntent rejects negative amounts", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: -5, currency: "usd" }),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "Payment amount must be a positive number",
  );
});

test("createPaymentIntent rejects non-numeric amounts", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: "not-a-number", currency: "usd" }),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "Payment amount must be a positive number",
  );
});
