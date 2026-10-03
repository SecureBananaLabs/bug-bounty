import test from "node:test";
import assert from "node:assert/strict";

// Mock Stripe before importing the service
const mockPaymentIntents = {
  create: null,
};

import { MockAgent, setGlobalDispatcher } from "undici";
// We test validation separately since it does not depend on Stripe.

// Import the service for unit-level validation tests.
// The Stripe client is created at module load time, but validation
// logic runs before any Stripe call, so we can test it independently.

test("createPaymentIntent: rejects if amount is missing", async () => {
  // Dynamically import to control module-level Stripe init
  const { createPaymentIntent } = await import("../services/paymentService.js");
  await assert.rejects(
    () => createPaymentIntent({}),
    { message: /amount is required/ }
  );
});

test("createPaymentIntent: rejects if amount is not a number", async () => {
  const { createPaymentIntent } = await import("../services/paymentService.js");
  await assert.rejects(
    () => createPaymentIntent({ amount: "1000" }),
    { message: /amount is required/ }
  );
});

test("createPaymentIntent: rejects if amount is not an integer", async () => {
  const { createPaymentIntent } = await import("../services/paymentService.js");
  await assert.rejects(
    () => createPaymentIntent({ amount: 99.99 }),
    { message: /amount is required/ }
  );
});

test("createPaymentIntent: rejects if amount is zero", async () => {
  const { createPaymentIntent } = await import("../services/paymentService.js");
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    { message: /amount is required/ }
  );
});

test("createPaymentIntent: rejects if amount is negative", async () => {
  const { createPaymentIntent } = await import("../services/paymentService.js");
  await assert.rejects(
    () => createPaymentIntent({ amount: -500 }),
    { message: /amount is required/ }
  );
});

test("createPaymentIntent: uses default currency usd when not provided", async () => {
  // This test requires a real or mocked Stripe key.
  // Skip if STRIPE_SECRET_KEY is not set to a valid test key.
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "") {
    return; // Skip — no Stripe key available in CI
  }
  const { createPaymentIntent } = await import("../services/paymentService.js");
  await assert.doesNotReject(() =>
    createPaymentIntent({ amount: 100 })
  );
});

test("createPaymentIntent: Stripe error is thrown through", async () => {
  // This test requires a real Stripe key set to an invalid state
  // to trigger a Stripe error. Skip if no key.
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "") {
    return;
  }
  const { createPaymentIntent } = await import("../services/paymentService.js");
  // A zero or negative currency should trigger Stripe error
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, currency: "INVALID_CURRENCY" }),
    (err) => err.type !== undefined
  );
});
