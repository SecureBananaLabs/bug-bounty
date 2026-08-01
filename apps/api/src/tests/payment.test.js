import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("throws if amount is missing", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  await assert.rejects(
    createPaymentIntent({ currency: "usd" }),
    /amount is required and must be a positive integer/
  );
});

test("throws if amount is not an integer", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  await assert.rejects(
    createPaymentIntent({ amount: 10.5, currency: "usd" }),
    /amount is required and must be a positive integer/
  );
});

test("throws if amount is zero", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  await assert.rejects(
    createPaymentIntent({ amount: 0, currency: "usd" }),
    /amount is required and must be a positive integer/
  );
});

test("throws if STRIPE_SECRET_KEY is not set", async () => {
  delete process.env.STRIPE_SECRET_KEY;
  await assert.rejects(
    createPaymentIntent({ amount: 2000, currency: "usd" }),
    /STRIPE_SECRET_KEY environment variable is not set/
  );
});
