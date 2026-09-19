import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  PaymentProviderError,
  PaymentValidationError,
  setStripeClientForTesting
} from "../services/paymentService.js";

test.afterEach(() => {
  setStripeClientForTesting(undefined);
});

test("createPaymentIntent validates amount before calling Stripe", async () => {
  setStripeClientForTesting({
    paymentIntents: {
      create() {
        throw new Error("Stripe should not be called");
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "amount must be a positive integer in the smallest currency unit"
  );
});

test("createPaymentIntent creates a Stripe PaymentIntent with defaults", async () => {
  let receivedPayload;
  setStripeClientForTesting({
    paymentIntents: {
      async create(payload) {
        receivedPayload = payload;
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc"
        };
      }
    }
  });

  const result = await createPaymentIntent({ amount: 2500 });

  assert.deepEqual(receivedPayload, {
    amount: 2500,
    currency: "usd",
    metadata: {}
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  setStripeClientForTesting({
    paymentIntents: {
      async create() {
        throw new Error("Your card was declined.");
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 500, currency: "usd" }),
    (error) => error instanceof PaymentProviderError && error.message === "Your card was declined."
  );
});
