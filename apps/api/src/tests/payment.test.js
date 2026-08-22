import test from "node:test";
import assert from "node:assert/strict";
import { PaymentError } from "../services/paymentService.js";

test("PaymentError has correct properties", () => {
  const err = new PaymentError("test message", 400);
  assert.equal(err.name, "PaymentError");
  assert.equal(err.message, "test message");
  assert.equal(err.status, 400);
});

test("PaymentError defaults status to 400", () => {
  const err = new PaymentError("default");
  assert.equal(err.status, 400);
});

test("createPaymentIntent rejects missing amount", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  const { createPaymentIntent } = await import("../services/paymentService.js");

  await assert.rejects(
    () => createPaymentIntent({}),
    (err) => err instanceof PaymentError && /must be a positive integer/.test(err.message)
  );
});

test("createPaymentIntent rejects non-integer amount", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  const { createPaymentIntent } = await import("../services/paymentService.js");

  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }),
    (err) => err instanceof PaymentError && /must be a positive integer/.test(err.message)
  );
});

test("createPaymentIntent rejects zero amount", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  const { createPaymentIntent } = await import("../services/paymentService.js");

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    (err) => err instanceof PaymentError && /must be a positive integer/.test(err.message)
  );
});

test("createPaymentIntent rejects negative amount", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  const { createPaymentIntent } = await import("../services/paymentService.js");

  await assert.rejects(
    () => createPaymentIntent({ amount: -500 }),
    (err) => err instanceof PaymentError && /must be a positive integer/.test(err.message)
  );
});

test("createPaymentIntent rejects invalid currency", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  const { createPaymentIntent } = await import("../services/paymentService.js");

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "us" }),
    (err) => err instanceof PaymentError && /3-letter ISO currency code/.test(err.message)
  );
});

test("createPaymentIntent throws when STRIPE_SECRET_KEY is missing", async () => {
  const origKey = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;

  try {
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await assert.rejects(
      () => createPaymentIntent({ amount: 1000 }),
      (err) => err instanceof PaymentError && /STRIPE_SECRET_KEY/.test(err.message) && err.status === 500
    );
  } finally {
    process.env.STRIPE_SECRET_KEY = origKey;
  }
});