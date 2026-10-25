import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

import { createPaymentIntent } from "../src/paymentService.js";
import { resetStripeClient } from "../src/stripeClient.js";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";
  resetStripeClient();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  resetStripeClient();
  mock.restoreAll();
});

test("throws when amount is missing", async () => {
  await assert.rejects(() => createPaymentIntent({}), /payload\.amount is required/);
});

test("throws when amount is not an integer", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }),
    /payload\.amount must be an integer/
  );
});

test("throws when amount is not positive", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /payload\.amount must be a positive integer/
  );
});

test("throws when currency is invalid", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, currency: "" }),
    /payload\.currency must be a non-empty string/
  );
});

test("defaults currency to usd and calls Stripe with correct arguments", async () => {
  const createMock = mock.fn(async (params) => ({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_abc",
    amount: params.amount,
    currency: params.currency
  }));

  const fakeStripe = {
    paymentIntents: { create: createMock }
  };

  // Inject the fake Stripe client by mocking the module factory.
  const stripeClientModule = await import("../src/stripeClient.js");
  mock.method(stripeClientModule, "getStripeClient", () => fakeStripe);

  const result = await createPaymentIntent({ amount: 500 });

  assert.equal(createMock.mock.callCount(), 1);
  const callArgs = createMock.mock.calls[0].arguments[0];
  assert.equal(callArgs.amount, 500);
  assert.equal(callArgs.currency, "usd");
  assert.deepEqual(callArgs.automatic_payment_methods, { enabled: true });
  assert.equal(callArgs.metadata, undefined);

  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 500,
    currency: "usd",
    provider: "stripe"
  });
});

test("passes metadata and custom currency to Stripe", async () => {
  const createMock = mock.fn(async (params) => ({
    id: "pi_test_456",
    client_secret: "pi_test_456_secret_def",
    amount: params.amount,
    currency: params.currency
  }));

  const fakeStripe = {
    paymentIntents: { create: createMock }
  };

  const stripeClientModule = await import("../src/stripeClient.js");
  mock.method(stripeClientModule, "getStripeClient", () => fakeStripe);

  const result = await createPaymentIntent({
    amount: 1200,
    currency: "EUR",
    metadata: { orderId: "order_42" }
  });

  const callArgs = createMock.mock.calls[0].arguments[0];
  assert.equal(callArgs.amount, 1200);
  assert.equal(callArgs.currency, "eur");
  assert.deepEqual(callArgs.metadata, { orderId: "order_42" });

  assert.equal(result.paymentId, "pi_test_456");
  assert.equal(result.clientSecret, "pi_test_456_secret_def");
  assert.equal(result.currency, "eur");
});

test("re-throws Stripe errors preserving the original message", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.name = "StripeCardError";
  stripeError.type = "card_error";
  stripeError.code = "card_declined";

  const createMock = mock.fn(async () => {
    throw stripeError;
  });

  const fakeStripe = {
    paymentIntents: { create: createMock }
  };

  const stripeClientModule = await import("../src/stripeClient.js");
  mock.method(stripeClientModule, "getStripeClient", () => fakeStripe);

  await assert.rejects(
    () => createPaymentIntent({ amount: 100 }),
    (err) => {
      assert.match(err.message, /Your card was declined\./);
      assert.equal(err.name, "StripeCardError");
      assert.equal(err.type, "card_error");
      assert.equal(err.code, "card_declined");
      assert.equal(err.originalError, stripeError);
      return true;
    }
  );
});

test("throws when STRIPE_SECRET_KEY is not set", async () => {
  delete process.env.STRIPE_SECRET_KEY;
  resetStripeClient();

  await assert.rejects(
    () => createPaymentIntent({ amount: 100 }),
    /STRIPE_SECRET_KEY/
  );
});
