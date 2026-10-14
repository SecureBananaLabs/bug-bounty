import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

function mockStripe(create = async () => ({ id: "pi_test", client_secret: "pi_test_secret" })) {
  return {
    paymentIntents: { create }
  };
}

test("createPaymentIntent creates a Stripe PaymentIntent and maps its response", async () => {
  let receivedParams;
  const stripe = mockStripe(async (params) => {
    receivedParams = params;
    return { id: "pi_123", client_secret: "pi_123_secret" };
  });

  const result = await createPaymentIntent({ amount: 2500 }, stripe);

  assert.deepEqual(receivedParams, { amount: 2500, currency: "usd" });
  assert.deepEqual(result, {
    paymentId: "pi_123",
    clientSecret: "pi_123_secret",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent normalizes a valid currency code", async () => {
  let receivedParams;
  const stripe = mockStripe(async (params) => {
    receivedParams = params;
    return { id: "pi_eur", client_secret: "secret_eur" };
  });

  await createPaymentIntent({ amount: 100, currency: "EUR" }, stripe);

  assert.deepEqual(receivedParams, { amount: 100, currency: "eur" });
});

test("createPaymentIntent validates and forwards optional metadata", async () => {
  let receivedParams;
  const stripe = mockStripe(async (params) => {
    receivedParams = params;
    return { id: "pi_metadata", client_secret: "secret_metadata" };
  });

  await createPaymentIntent({ amount: 100, metadata: { orderId: "order_123" } }, stripe);

  assert.deepEqual(receivedParams, {
    amount: 100,
    currency: "usd",
    metadata: { orderId: "order_123" }
  });
});

test("createPaymentIntent rejects invalid metadata before Stripe is called", async () => {
  let calls = 0;
  const stripe = mockStripe(async () => {
    calls += 1;
    return { id: "unused", client_secret: "unused" };
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 100, metadata: [] }, stripe),
    /payload\.metadata must be an object/
  );
  assert.equal(calls, 0);
});

test("createPaymentIntent rejects missing or invalid amounts before Stripe is called", async () => {
  let calls = 0;
  const stripe = mockStripe(async () => {
    calls += 1;
    return { id: "unused", client_secret: "unused" };
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, stripe),
    /payload\.amount must be a positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 12.5 }, stripe),
    /payload\.amount must be a positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({}, stripe),
    /payload\.amount must be a positive integer/
  );

  assert.equal(calls, 0);
});

test("createPaymentIntent rejects invalid currency before Stripe is called", async () => {
  let calls = 0;
  const stripe = mockStripe(async () => {
    calls += 1;
    return { id: "unused", client_secret: "unused" };
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 100, currency: "dollars" }, stripe),
    /payload\.currency must be a three-letter currency code/
  );
  assert.equal(calls, 0);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripe = mockStripe(async () => {
    throw new Error("Your card was declined");
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 100 }, stripe),
    (error) => {
      assert.match(error.message, /Stripe payment intent creation failed/);
      assert.match(error.message, /Your card was declined/);
      assert.equal(error.cause.message, "Your card was declined");
      return true;
    }
  );
});

const integrationEnabled =
  process.env.RUN_STRIPE_INTEGRATION_TESTS === "1" && Boolean(process.env.STRIPE_SECRET_KEY);

test("Stripe integration creates a test-mode PaymentIntent", { skip: !integrationEnabled }, async () => {
  const result = await createPaymentIntent({ amount: 50 });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_/);
  assert.equal(result.amount, 50);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});
