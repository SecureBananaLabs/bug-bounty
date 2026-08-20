import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

function makeStripeClient(overrides = {}) {
  return {
    paymentIntents: {
      create: async () => ({ id: "pi_test_123", client_secret: "secret_test_123" }),
      ...overrides,
    },
  };
}

test("returns clientSecret and paymentId from Stripe response", async () => {
  const result = await createPaymentIntent({ amount: 2500 }, makeStripeClient());
  assert.deepEqual(result, { clientSecret: "secret_test_123", paymentId: "pi_test_123" });
});

test("sends amount and default currency usd to Stripe", async () => {
  let captured;
  const client = makeStripeClient({
    create: async (params) => { captured = params; return { id: "pi_1", client_secret: "cs_1" }; },
  });
  await createPaymentIntent({ amount: 100 }, client);
  assert.deepEqual(captured, { amount: 100, currency: "usd" });
});

test("sends explicit currency when provided", async () => {
  let captured;
  const client = makeStripeClient({
    create: async (params) => { captured = params; return { id: "pi_2", client_secret: "cs_2" }; },
  });
  await createPaymentIntent({ amount: 500, currency: "EUR" }, client);
  assert.equal(captured.currency, "eur");
});

test("sends metadata when provided", async () => {
  let captured;
  const client = makeStripeClient({
    create: async (params) => { captured = params; return { id: "pi_3", client_secret: "cs_3" }; },
  });
  await createPaymentIntent({ amount: 1000, metadata: { orderId: "order_42" } }, client);
  assert.deepEqual(captured.metadata, { orderId: "order_42" });
});

test("omits metadata key when not provided", async () => {
  let captured;
  const client = makeStripeClient({
    create: async (params) => { captured = params; return { id: "pi_4", client_secret: "cs_4" }; },
  });
  await createPaymentIntent({ amount: 200 }, client);
  assert.equal("metadata" in captured, false);
});

test("throws when amount is missing", async () => {
  await assert.rejects(
    () => createPaymentIntent({}, makeStripeClient()),
    /payload\.amount is required/
  );
});

test("throws when amount is zero", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, makeStripeClient()),
    /positive integer/
  );
});

test("throws when amount is negative", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: -1 }, makeStripeClient()),
    /positive integer/
  );
});

test("throws when amount is a float", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 9.99 }, makeStripeClient()),
    /integer/
  );
});

test("rethrows Stripe errors preserving the original message", async () => {
  const client = makeStripeClient({
    create: async () => { throw new Error("Your card has insufficient funds."); },
  });
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, client),
    /insufficient funds/
  );
});
