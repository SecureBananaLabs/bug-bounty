import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentValidationError } from "../services/paymentService.js";

// Unit tests for paymentService validation logic

test("createPaymentIntent validates required amount", async () => {
  await assert.rejects(
    createPaymentIntent({}),
    (err) => err instanceof PaymentValidationError && err.message === "amount is required"
  );

  await assert.rejects(
    createPaymentIntent({ amount: null }),
    (err) => err instanceof PaymentValidationError && err.message === "amount is required"
  );

  await assert.rejects(
    createPaymentIntent({ amount: undefined }),
    (err) => err instanceof PaymentValidationError && err.message === "amount is required"
  );
});

test("createPaymentIntent validates amount is an integer", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 10.5 }),
    (err) => err instanceof PaymentValidationError && err.message.includes("must be an integer")
  );

  await assert.rejects(
    createPaymentIntent({ amount: "100" }),
    (err) => err instanceof PaymentValidationError && err.message.includes("must be an integer")
  );
});

test("createPaymentIntent validates amount is positive", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 0 }),
    (err) => err instanceof PaymentValidationError && err.message.includes("positive integer")
  );

  await assert.rejects(
    createPaymentIntent({ amount: -100 }),
    (err) => err instanceof PaymentValidationError && err.message.includes("positive integer")
  );
});

test("createPaymentIntent validates payload is an object", async () => {
  await assert.rejects(
    createPaymentIntent(null),
    (err) => err instanceof PaymentValidationError && err.message.includes("Payload is required")
  );

  await assert.rejects(
    createPaymentIntent("string"),
    (err) => err instanceof PaymentValidationError && err.message.includes("Payload is required")
  );
});

test("createPaymentIntent validates currency is a string", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 100, currency: 123 }),
    (err) => err instanceof PaymentValidationError && err.message.includes("currency must be a string")
  );
});
