import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, setStripeClient } from "../services/paymentService.js";

// ------------------------------------------------------------------
// Mock helpers
// ------------------------------------------------------------------
let createCallCount = 0;
let lastCreateArgs = null;

function makeMockStripe(createFn) {
  return {
    paymentIntents: {
      create: async (...args) => {
        createCallCount++;
        lastCreateArgs = args[0];
        return createFn(args[0]);
      },
    },
  };
}

function makePI(overrides = {}) {
  return {
    id: "pi_test_12345",
    client_secret: "pi_test_12345_secret_test",
    amount: 1000,
    currency: "usd",
    status: "requires_payment_method",
    ...overrides,
  };
}

function reset() {
  createCallCount = 0;
  lastCreateArgs = null;
}

// ------------------------------------------------------------------
// Validation tests (no Stripe needed)
// ------------------------------------------------------------------

test("createPaymentIntent throws when amount is missing", async () => {
  reset();
  await assert.rejects(() => createPaymentIntent({}), /amount is required/);
});

test("createPaymentIntent throws when amount is negative", async () => {
  reset();
  await assert.rejects(
    () => createPaymentIntent({ amount: -100 }),
    /positive integer/
  );
});

test("createPaymentIntent throws when amount is zero", async () => {
  reset();
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /positive integer/
  );
});

test("createPaymentIntent throws when amount is a float", async () => {
  reset();
  await assert.rejects(
    () => createPaymentIntent({ amount: 1.5 }),
    /positive integer/
  );
});

test("createPaymentIntent throws when amount is a string", async () => {
  reset();
  await assert.rejects(
    () => createPaymentIntent({ amount: "100" }),
    /positive integer/
  );
});

test("createPaymentIntent throws when amount is undefined", async () => {
  reset();
  await assert.rejects(
    () => createPaymentIntent({ amount: undefined }),
    /amount is required/
  );
});

// ------------------------------------------------------------------
// Happy-path tests (with mock Stripe)
// ------------------------------------------------------------------

test("createPaymentIntent passes correct args to stripe.paymentIntents.create", async () => {
  reset();
  setStripeClient(makeMockStripe((args) => makePI({ amount: args.amount, currency: args.currency })));
  const result = await createPaymentIntent({ amount: 5000, currency: "eur" });
  assert.equal(createCallCount, 1);
  assert.equal(lastCreateArgs.amount, 5000);
  assert.equal(lastCreateArgs.currency, "eur");
  assert.equal(result.paymentId, "pi_test_12345");
  assert.equal(result.clientSecret, "pi_test_12345_secret_test");
  assert.equal(result.provider, "stripe");
  assert.equal(result.amount, 5000);
  assert.equal(result.currency, "eur");
});

test("createPaymentIntent maps paymentIntent fields to legacy shape", async () => {
  reset();
  setStripeClient(makeMockStripe(() => makePI({ id: "pi_xyz", status: "succeeded" })));
  const result = await createPaymentIntent({ amount: 3000 });
  assert.equal(result.paymentId, "pi_xyz");
  assert.equal(result.clientSecret, "pi_test_12345_secret_test");
  assert.equal(result.status, "succeeded");
});

test("createPaymentIntent defaults currency to usd when not provided", async () => {
  reset();
  setStripeClient(makeMockStripe((args) => makePI({ amount: args.amount, currency: args.currency })));
  await createPaymentIntent({ amount: 1000 });
  assert.equal(lastCreateArgs.currency, "usd");
});

test("createPaymentIntent includes automatic_payment_methods.enabled in create call", async () => {
  reset();
  setStripeClient(makeMockStripe((args) => makePI({ amount: args.amount, currency: args.currency })));
  await createPaymentIntent({ amount: 2000 });
  assert.equal(lastCreateArgs.automatic_payment_methods?.enabled, true);
});

test("createPaymentIntent rejects on Stripe error preserving original message", async () => {
  reset();
  setStripeClient(
    makeMockStripe(() => {
      const err = new Error("Your card was declined.");
      err.type = "StripeCardError";
      err.statusCode = 402;
      throw err;
    })
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    /Your card was declined\./
  );
});

test("createPaymentIntent handles StripeInvalidRequestError preserving message", async () => {
  reset();
  setStripeClient(
    makeMockStripe(() => {
      const err = new Error("No such payment_intent.");
      err.type = "StripeInvalidRequestError";
      err.statusCode = 404;
      throw err;
    })
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    /No such payment_intent\./
  );
});