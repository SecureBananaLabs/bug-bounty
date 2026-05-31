import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent sends amount and default currency to Stripe", async () => {
  const create = test.mock.fn(async () => ({
    id: "pi_test_123",
    client_secret: "secret_test_123"
  }));

  const stripeClient = {
    paymentIntents: {
      create
    }
  };

  const result = await createPaymentIntent({ amount: 2500 }, stripeClient);

  assert.deepEqual(result, {
    clientSecret: "secret_test_123",
    paymentId: "pi_test_123"
  });
  assert.equal(create.mock.calls.length, 1);
  assert.deepEqual(create.mock.calls[0].arguments[0], {
    amount: 2500,
    currency: "usd"
  });
});

test("createPaymentIntent rethrows Stripe errors with the original message", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw new Error("Stripe request failed");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, stripeClient),
    /Stripe request failed/
  );
});

test("createPaymentIntent rejects non-positive integer amounts", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw new Error("should not be called");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, stripeClient),
    /payload\.amount must be a positive integer/
  );
});
