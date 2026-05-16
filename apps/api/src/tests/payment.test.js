import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;

test.afterEach(() => {
  if (originalStripeSecretKey === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
  } else {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
  }
});

test("createPaymentIntent requires integer positive amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 12.5, currency: "usd" }),
    /Expected integer/
  );
});

test("createPaymentIntent requires STRIPE_SECRET_KEY", async () => {
  delete process.env.STRIPE_SECRET_KEY;

  await assert.rejects(
    () => createPaymentIntent({ amount: 5000, currency: "usd" }),
    /STRIPE_SECRET_KEY is required/
  );
});
